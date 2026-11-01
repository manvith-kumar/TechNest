package com.technest.unit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.technest.dto.OrderDtos.CreateOrderRequest;
import com.technest.dto.OrderDtos.UpdateOrderStatusRequest;
import com.technest.entity.*;
import com.technest.enums.*;
import com.technest.exception.ConflictException;
import com.technest.exception.InsufficientStockException;
import com.technest.exception.PaymentFailedException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.*;
import com.technest.service.InventoryService;
import com.technest.service.impl.OrderServiceImpl;
import com.technest.util.PricingCalculator;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OrderServiceTest {
    OrderRepository orders = mock(OrderRepository.class);
    CartRepository carts = mock(CartRepository.class);
    AddressRepository addresses = mock(AddressRepository.class);
    ProductRepository products = mock(ProductRepository.class);
    ReviewRepository reviews = mock(ReviewRepository.class);
    UserRepository users = mock(UserRepository.class);
    InventoryService inventory = mock(InventoryService.class);
    OrderServiceImpl service;

    Product product;
    Cart cart;

    @BeforeEach
    void setUp() {
        service = new OrderServiceImpl(orders, carts, addresses, products, reviews, users, inventory,
                new PricingCalculator(new BigDecimal("5000"), new BigDecimal("99")), new EntityMapper());
        User user = new User();
        user.setId(7L);
        when(users.getReferenceById(7L)).thenReturn(user);

        Category cat = new Category();
        cat.setId(1L);
        cat.setName("Audio");
        product = new Product();
        product.setId(10L);
        product.setName("Test Headphones");
        product.setCategory(cat);
        product.setPrice(new BigDecimal("3000.00"));
        product.setDiscountPrice(new BigDecimal("2500.00"));
        product.setStockQuantity(3);

        cart = new Cart();
        cart.setUser(user);
        CartItem item = new CartItem();
        item.setId(100L);
        item.setCart(cart);
        item.setProduct(product);
        item.setQuantity(2);
        cart.getItems().add(item);

        Address a = new Address();
        a.setRecipientName("Test");
        a.setPhone("9000000000");
        a.setLine1("1 Road");
        a.setCity("Chennai");
        a.setState("TN");
        a.setPostalCode("600001");
        a.setCountry("India");
        when(addresses.findByIdAndUserId(5L, 7L)).thenReturn(Optional.of(a));
        when(carts.findByUserId(7L)).thenReturn(Optional.of(cart));
        when(orders.existsByOrderNumber(anyString())).thenReturn(false);
        when(orders.saveAndFlush(any(Order.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void usesServerPricesAndClearsPurchasedItems() {
        when(products.decrementStock(10L, 2)).thenReturn(1);
        var dto = service.place(7L, new CreateOrderRequest(5L, PaymentMethod.COD, null, null, null));
        assertEquals(new BigDecimal("5000.00"), dto.subtotal());   // 2 x discounted 2500.00, from the entity, not the client
        assertEquals(0, dto.shippingFee().signum());               // reached the free-shipping threshold
        assertEquals(PaymentStatus.PENDING, dto.payment().status());
        assertTrue(cart.getItems().isEmpty());
        verify(inventory).recordChange(eq(10L), eq(-2), eq(StockReason.ORDER_PLACED), any(), any(), eq(7L));
    }

    @Test
    void failsWhenStockIsInsufficientAndSavesNothing() {
        when(products.decrementStock(10L, 2)).thenReturn(0);   // atomic UPDATE matched no row
        assertThrows(InsufficientStockException.class,
                () -> service.place(7L, new CreateOrderRequest(5L, PaymentMethod.COD, null, null, null)));
        verify(orders, never()).saveAndFlush(any());
        assertEquals(1, cart.getItems().size());
    }

    @Test
    void simulatedPaymentFailureHasNoSideEffects() {
        assertThrows(PaymentFailedException.class,
                () -> service.place(7L, new CreateOrderRequest(5L, PaymentMethod.DEMO_ONLINE, null, null, true)));
        verify(products, never()).decrementStock(anyLong(), anyInt());
        verify(orders, never()).saveAndFlush(any());
    }

    @Test
    void cancelRestoresStockExactlyOnce() {
        Order o = placedOrder(OrderStatus.PLACED);
        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(o));

        service.cancelMine(7L, 1L);
        verify(products, times(1)).incrementStock(10L, 2);
        assertEquals(OrderStatus.CANCELLED, o.getStatus());
        assertEquals(PaymentStatus.CANCELLED, o.getPayment().getStatus());
        assertTrue(o.isStockRestored());

        assertThrows(ConflictException.class, () -> service.cancelMine(7L, 1L));   // already terminal
        verify(products, times(1)).incrementStock(anyLong(), anyInt());
    }

    @Test
    void customerCannotCancelOnceProcessing() {
        Order o = placedOrder(OrderStatus.PROCESSING);
        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(o));
        assertThrows(ConflictException.class, () -> service.cancelMine(7L, 1L));
        verify(products, never()).incrementStock(anyLong(), anyInt());
    }

    @Test
    void adminCannotSkipStatuses() {
        Order o = placedOrder(OrderStatus.PLACED);
        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(o));
        assertThrows(ConflictException.class,
                () -> service.adminUpdateStatus(1L, 1L, new UpdateOrderStatusRequest(OrderStatus.DELIVERED, null)));
    }

    @Test
    void codIsMarkedPaidOnDelivery() {
        Order o = placedOrder(OrderStatus.SHIPPED);
        when(orders.findByIdForUpdate(1L)).thenReturn(Optional.of(o));
        service.adminUpdateStatus(1L, 1L, new UpdateOrderStatusRequest(OrderStatus.DELIVERED, null));
        assertEquals(PaymentStatus.PAID, o.getPayment().getStatus());
    }

    private Order placedOrder(OrderStatus status) {
        User u = new User();
        u.setId(7L);
        Order o = new Order();
        o.setId(1L);
        o.setUser(u);
        o.setOrderNumber("TN-TEST");
        o.setStatus(status);
        OrderItem oi = new OrderItem();
        oi.setProduct(product);
        oi.setQuantity(2);
        o.addItem(oi);
        Payment p = new Payment();
        p.setMethod(PaymentMethod.COD);
        p.setStatus(PaymentStatus.PENDING);
        o.attachPayment(p);
        return o;
    }
}
