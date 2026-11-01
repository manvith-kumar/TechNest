package com.technest.service.impl;

import com.technest.dto.CartDtos.CartDto;
import com.technest.dto.CartDtos.CartItemDto;
import com.technest.entity.Cart;
import com.technest.entity.CartItem;
import com.technest.entity.Product;
import com.technest.exception.BadRequestException;
import com.technest.exception.InsufficientStockException;
import com.technest.exception.ResourceNotFoundException;
import com.technest.repository.CartRepository;
import com.technest.repository.ProductRepository;
import com.technest.repository.UserRepository;
import com.technest.service.CartService;
import com.technest.util.PricingCalculator;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CartServiceImpl implements CartService {
    static final int MAX_PER_PRODUCT = 10;

    private final CartRepository carts;
    private final ProductRepository products;
    private final UserRepository users;
    private final PricingCalculator pricing;

    public CartServiceImpl(CartRepository carts, ProductRepository products, UserRepository users, PricingCalculator pricing) {
        this.carts = carts;
        this.products = products;
        this.users = users;
        this.pricing = pricing;
    }

    private Cart cartFor(Long userId) {
        return carts.findByUserId(userId).orElseGet(() -> {
            Cart c = new Cart();
            c.setUser(users.getReferenceById(userId));
            return carts.save(c);
        });
    }

    private static String image(Product p) {
        return p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl();
    }

    private CartDto toDto(Cart cart) {
        List<CartItemDto> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal savings = BigDecimal.ZERO;
        int count = 0;
        boolean blocked = cart.getItems().isEmpty();
        for (CartItem ci : cart.getItems()) {
            Product p = ci.getProduct();
            BigDecimal unit = p.currentPrice();
            BigDecimal line = pricing.lineTotal(unit, ci.getQuantity());
            boolean available = p.isActive() && p.getStockQuantity() >= ci.getQuantity();
            if (!available) blocked = true;
            subtotal = subtotal.add(line);
            savings = savings.add(p.getPrice().subtract(unit).multiply(BigDecimal.valueOf(ci.getQuantity())));
            count += ci.getQuantity();
            items.add(new CartItemDto(ci.getId(), p.getId(), p.getName(), p.getSlug(), p.getBrand(), image(p), unit,
                    p.getPrice(), ci.getQuantity(), line, p.getStockQuantity(), available));
        }
        PricingCalculator.Quote q = pricing.quote(subtotal, savings);
        return new CartDto(cart.getId(), items, count, q.subtotal(), q.savings(), q.shippingFee(), q.total(),
                pricing.getFreeThreshold(), pricing.getFlatFee(), blocked);
    }

    @Override
    @Transactional
    public CartDto getCart(Long userId) {
        return toDto(cartFor(userId));
    }

    @Override
    @Transactional
    public CartDto addItem(Long userId, Long productId, int quantity) {
        Product p = products.findByIdAndActiveTrue(productId)
                .orElseThrow(() -> new ResourceNotFoundException("This product is not available."));
        if (p.getStockQuantity() <= 0) throw new InsufficientStockException(p.getName() + " is out of stock.");
        Cart cart = cartFor(userId);
        CartItem existing = cart.getItems().stream().filter(i -> i.getProduct().getId().equals(productId)).findFirst().orElse(null);
        int total = (existing == null ? 0 : existing.getQuantity()) + quantity;
        if (total > MAX_PER_PRODUCT) throw new BadRequestException("You can buy at most " + MAX_PER_PRODUCT + " units of a product per order.");
        if (total > p.getStockQuantity()) {
            throw new InsufficientStockException("Only " + p.getStockQuantity() + " unit(s) of " + p.getName() + " available.");
        }
        if (existing == null) {
            CartItem item = new CartItem();
            item.setCart(cart);
            item.setProduct(p);
            item.setQuantity(total);
            cart.getItems().add(item);
        } else {
            existing.setQuantity(total);
        }
        carts.saveAndFlush(cart);
        return toDto(cart);
    }

    private CartItem findItem(Cart cart, Long itemId) {
        return cart.getItems().stream().filter(i -> i.getId().equals(itemId)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("That item is not in your cart."));
    }

    @Override
    @Transactional
    public CartDto updateItem(Long userId, Long itemId, int quantity) {
        Cart cart = cartFor(userId);
        CartItem item = findItem(cart, itemId);   // ownership: only items of this user's cart can be found
        Product p = item.getProduct();
        if (quantity > MAX_PER_PRODUCT) throw new BadRequestException("You can buy at most " + MAX_PER_PRODUCT + " units of a product per order.");
        if (quantity > p.getStockQuantity()) {
            throw new InsufficientStockException("Only " + p.getStockQuantity() + " unit(s) of " + p.getName() + " available.");
        }
        item.setQuantity(quantity);
        return toDto(cart);
    }

    @Override
    @Transactional
    public CartDto removeItem(Long userId, Long itemId) {
        Cart cart = cartFor(userId);
        cart.getItems().remove(findItem(cart, itemId));
        return toDto(cart);
    }

    @Override
    @Transactional
    public CartDto clear(Long userId) {
        Cart cart = cartFor(userId);
        cart.getItems().clear();
        return toDto(cart);
    }
}
