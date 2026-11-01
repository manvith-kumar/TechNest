package com.technest.unit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.technest.entity.*;
import com.technest.exception.BadRequestException;
import com.technest.exception.InsufficientStockException;
import com.technest.repository.*;
import com.technest.service.impl.CartServiceImpl;
import com.technest.util.PricingCalculator;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CartServiceTest {
    CartRepository carts = mock(CartRepository.class);
    ProductRepository products = mock(ProductRepository.class);
    UserRepository users = mock(UserRepository.class);
    CartServiceImpl service;
    Product product;

    @BeforeEach
    void setUp() {
        service = new CartServiceImpl(carts, products, users, new PricingCalculator(new BigDecimal("5000"), new BigDecimal("99")));
        Cart cart = new Cart();
        when(carts.findByUserId(1L)).thenReturn(Optional.of(cart));
        when(carts.saveAndFlush(any(Cart.class))).thenAnswer(i -> i.getArgument(0));
        product = new Product();
        product.setId(9L);
        product.setName("Mouse");
        product.setPrice(new BigDecimal("1000"));
        product.setStockQuantity(3);
        product.setActive(true);
        Category c = new Category();
        c.setId(1L);
        product.setCategory(c);
        when(products.findByIdAndActiveTrue(9L)).thenReturn(Optional.of(product));
    }

    @Test
    void addsAndMergesQuantities() {
        service.addItem(1L, 9L, 1);
        var cart = service.addItem(1L, 9L, 2);
        assertEquals(1, cart.items().size());
        assertEquals(3, cart.items().get(0).quantity());
    }

    @Test
    void refusesMoreThanStock() {
        service.addItem(1L, 9L, 3);
        assertThrows(InsufficientStockException.class, () -> service.addItem(1L, 9L, 1));
    }

    @Test
    void refusesOutOfStockProducts() {
        product.setStockQuantity(0);
        assertThrows(InsufficientStockException.class, () -> service.addItem(1L, 9L, 1));
    }

    @Test
    void capsQuantityPerProduct() {
        product.setStockQuantity(50);
        assertThrows(BadRequestException.class, () -> service.addItem(1L, 9L, 11));
    }
}
