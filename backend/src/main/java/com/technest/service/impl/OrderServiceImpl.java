package com.technest.service.impl;

import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.OrderDtos.*;
import com.technest.entity.*;
import com.technest.enums.*;
import com.technest.exception.*;
import com.technest.mapper.EntityMapper;
import com.technest.repository.*;
import com.technest.service.InventoryService;
import com.technest.service.OrderService;
import com.technest.util.OrderNumberGenerator;
import com.technest.util.PricingCalculator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orders;
    private final CartRepository carts;
    private final AddressRepository addresses;
    private final ProductRepository products;
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final InventoryService inventory;
    private final PricingCalculator pricing;
    private final EntityMapper mapper;

    public OrderServiceImpl(OrderRepository orders, CartRepository carts, AddressRepository addresses,
                            ProductRepository products, ReviewRepository reviews, UserRepository users,
                            InventoryService inventory, PricingCalculator pricing, EntityMapper mapper) {
        this.orders = orders;
        this.carts = carts;
        this.addresses = addresses;
        this.products = products;
        this.reviews = reviews;
        this.users = users;
        this.inventory = inventory;
        this.pricing = pricing;
        this.mapper = mapper;
    }

    // ------------------------------------------------------------------ placing an order

    /**
     * One transaction: stock is decremented with atomic conditional UPDATEs (never below zero), prices are read from the
     * database, and totals are recomputed here. Any failure rolls back stock, order, payment and cart changes together.
     */
    @Override
    @Transactional
    public OrderDto place(Long userId, CreateOrderRequest req) {
        String key = req.idempotencyKey() == null || req.idempotencyKey().isBlank() ? null : req.idempotencyKey().trim();
        if (key != null) {
            Optional<Order> existing = orders.findByUserIdAndIdempotencyKey(userId, key);
            if (existing.isPresent()) return toDto(existing.get(), userId);   // double-submit: return the first result
        }
        Address addr = addresses.findByIdAndUserId(req.addressId(), userId)
                .orElseThrow(() -> new BadRequestException("Select a valid delivery address."));
        Cart cart = carts.findByUserId(userId).orElseThrow(() -> new BadRequestException("Your cart is empty."));

        Set<Long> wanted = req.cartItemIds() == null ? Set.of() : new HashSet<>(req.cartItemIds());
        List<CartItem> selected = cart.getItems().stream()
                .filter(i -> wanted.isEmpty() || wanted.contains(i.getId()))
                .sorted(Comparator.comparing(i -> i.getProduct().getId()))   // consistent lock order prevents deadlocks
                .collect(Collectors.toList());
        if (selected.isEmpty()) throw new BadRequestException("Your cart is empty.");
        if (!wanted.isEmpty() && selected.size() != wanted.size()) {
            throw new BadRequestException("Some selected items are no longer in your cart.");
        }

        // The simulated failure happens before any side effect, so nothing needs undoing.
        if (req.paymentMethod() == PaymentMethod.DEMO_ONLINE && Boolean.TRUE.equals(req.simulatePaymentFailure())) {
            throw new PaymentFailedException("The simulated payment was declined. No order was placed and nothing was charged.");
        }

        Order order = new Order();
        order.setUser(users.getReferenceById(userId));
        order.setIdempotencyKey(key);
        order.setShipName(addr.getRecipientName());
        order.setShipPhone(addr.getPhone());
        order.setShipLine1(addr.getLine1());
        order.setShipLine2(addr.getLine2());
        order.setShipCity(addr.getCity());
        order.setShipState(addr.getState());
        order.setShipPostal(addr.getPostalCode());
        order.setShipCountry(addr.getCountry());

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal savings = BigDecimal.ZERO;
        for (CartItem ci : selected) {
            Product p = ci.getProduct();
            int qty = ci.getQuantity();
            if (!p.isActive()) {
                throw new InsufficientStockException(p.getName() + " is no longer available. Remove it from your cart to continue.");
            }
            if (products.decrementStock(p.getId(), qty) == 0) {
                throw new InsufficientStockException("Not enough stock for " + p.getName() + ". Update your cart and try again.");
            }
            products.incrementSold(p.getId(), qty);

            BigDecimal unit = p.currentPrice();   // server-side price, never from the client
            OrderItem oi = new OrderItem();
            oi.setProduct(p);
            oi.setProductName(p.getName());
            oi.setProductImage(p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl());
            oi.setUnitPrice(unit);
            oi.setOriginalPrice(p.getPrice());
            oi.setQuantity(qty);
            oi.setLineTotal(pricing.lineTotal(unit, qty));
            order.addItem(oi);
            subtotal = subtotal.add(oi.getLineTotal());
            savings = savings.add(p.getPrice().subtract(unit).multiply(BigDecimal.valueOf(qty)));
        }

        PricingCalculator.Quote quote = pricing.quote(subtotal, savings);
        order.setSubtotal(quote.subtotal());
        order.setDiscountTotal(quote.savings());
        order.setShippingFee(quote.shippingFee());
        order.setTotalAmount(quote.total());
        String number;
        do {
            number = OrderNumberGenerator.next();
        } while (orders.existsByOrderNumber(number));
        order.setOrderNumber(number);

        Payment payment = new Payment();
        payment.setMethod(req.paymentMethod());
        payment.setAmount(quote.total());
        if (req.paymentMethod() == PaymentMethod.DEMO_ONLINE) {
            payment.setSimulated(true);   // clearly a simulation: no gateway, no card data
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaidAt(LocalDateTime.now());
            payment.setTransactionRef("DEMO-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase());
        } else {
            payment.setSimulated(false);
            payment.setStatus(PaymentStatus.PENDING);   // collected on delivery
        }
        order.attachPayment(payment);
        order.recordStatus(OrderStatus.PLACED, "Order placed", userId);
        orders.saveAndFlush(order);

        for (OrderItem oi : order.getItems()) {
            inventory.recordChange(oi.getProduct().getId(), -oi.getQuantity(), StockReason.ORDER_PLACED, order.getOrderNumber(), order.getId(), userId);
        }
        cart.getItems().removeAll(selected);   // only purchased lines leave the cart
        return toDto(order, userId);
    }

    // ------------------------------------------------------------------ reading

    private OrderDto toDto(Order o, Long reviewerId) {
        Set<Long> reviewed = Set.of();
        if (o.getStatus() == OrderStatus.DELIVERED && reviewerId != null) {
            List<Long> pids = o.getItems().stream().map(i -> i.getProduct().getId()).toList();
            reviewed = new HashSet<>(reviews.findReviewedProductIds(reviewerId, pids));
        }
        return mapper.toOrderDto(o, reviewed);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderDto> myOrders(Long userId, Pageable pageable) {
        Page<Order> page = orders.findByUserId(userId, pageable);
        List<Long> deliveredProducts = page.getContent().stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .flatMap(o -> o.getItems().stream()).map(i -> i.getProduct().getId()).distinct().toList();
        Set<Long> reviewed = deliveredProducts.isEmpty() ? Set.of()
                : new HashSet<>(reviews.findReviewedProductIds(userId, deliveredProducts));
        return PageResponse.of(page, o -> mapper.toOrderDto(o, o.getStatus() == OrderStatus.DELIVERED ? reviewed : Set.of()));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto getMine(Long userId, Long orderId) {
        Order o = orders.findByIdAndUserId(orderId, userId).orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        return toDto(o, userId);
    }

    // ------------------------------------------------------------------ cancelling / status changes

    /** Restores stock exactly once (guarded by stockRestored), settles the payment and records the status change. */
    private void cancelInternal(Order o, Long actorId, String note) {
        if (!o.isStockRestored()) {
            List<OrderItem> items = new ArrayList<>(o.getItems());
            items.sort(Comparator.comparing(i -> i.getProduct().getId()));
            for (OrderItem i : items) {
                Long pid = i.getProduct().getId();
                products.incrementStock(pid, i.getQuantity());
                products.decrementSold(pid, i.getQuantity());
                inventory.recordChange(pid, i.getQuantity(), StockReason.ORDER_CANCELLED, o.getOrderNumber(), o.getId(), actorId);
            }
            o.setStockRestored(true);
        }
        Payment p = o.getPayment();
        if (p != null) {
            if (p.getStatus() == PaymentStatus.PAID) p.setStatus(PaymentStatus.REFUNDED);   // simulated refund
            else if (p.getStatus() == PaymentStatus.PENDING) p.setStatus(PaymentStatus.CANCELLED);
        }
        o.recordStatus(OrderStatus.CANCELLED, note, actorId);
    }

    @Override
    @Transactional
    public OrderDto cancelMine(Long userId, Long orderId) {
        Order o = orders.findByIdForUpdate(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        if (!o.getUser().getId().equals(userId)) throw new ResourceNotFoundException("Order not found.");
        if (!o.getStatus().isCustomerCancellable()) {
            throw new ConflictException("This order can no longer be cancelled because it is already "
                    + o.getStatus().name().toLowerCase(Locale.ROOT) + ".");
        }
        cancelInternal(o, userId, "Cancelled by customer");
        return toDto(o, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderDto> adminList(OrderStatus status, String q, LocalDate from, LocalDate to, Pageable pageable) {
        LocalDateTime f = from == null ? null : from.atStartOfDay();
        LocalDateTime t = to == null ? null : to.plusDays(1).atStartOfDay();
        return PageResponse.of(orders.findAll(OrderSpecs.admin(status, q, f, t), pageable), o -> mapper.toOrderDto(o, Set.of()));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDto adminGet(Long orderId) {
        Order o = orders.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        return mapper.toOrderDto(o, Set.of());
    }

    @Override
    @Transactional
    public OrderDto adminUpdateStatus(Long adminId, Long orderId, UpdateOrderStatusRequest req) {
        Order o = orders.findByIdForUpdate(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found."));
        OrderStatus current = o.getStatus();
        OrderStatus target = req.status();
        if (!current.canTransitionTo(target)) {
            throw new ConflictException("An order that is " + current.name().toLowerCase(Locale.ROOT)
                    + " cannot be changed to " + target.name().toLowerCase(Locale.ROOT) + ".");
        }
        String note = req.note() == null || req.note().isBlank() ? null : req.note().trim();
        if (target == OrderStatus.CANCELLED) {
            cancelInternal(o, adminId, note == null ? "Cancelled by admin" : note);
        } else {
            o.recordStatus(target, note == null ? "Status changed to " + target.name().toLowerCase(Locale.ROOT) : note, adminId);
            Payment p = o.getPayment();
            if (target == OrderStatus.DELIVERED && p != null && p.getMethod() == PaymentMethod.COD && p.getStatus() == PaymentStatus.PENDING) {
                p.setStatus(PaymentStatus.PAID);   // cash collected at the door
                p.setPaidAt(LocalDateTime.now());
            }
        }
        return mapper.toOrderDto(o, Set.of());
    }
}
