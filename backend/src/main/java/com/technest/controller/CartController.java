package com.technest.controller;

import com.technest.dto.CartDtos.*;
import com.technest.security.UserPrincipal;
import com.technest.service.CartService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
public class CartController {
    private final CartService cart;

    public CartController(CartService cart) {
        this.cart = cart;
    }

    @GetMapping
    public CartDto get(@AuthenticationPrincipal UserPrincipal p) {
        return cart.getCart(p.getId());
    }

    @PostMapping("/items")
    public CartDto add(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody AddCartItemRequest req) {
        return cart.addItem(p.getId(), req.productId(), req.quantity());
    }

    @PutMapping("/items/{id}")
    public CartDto update(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody UpdateCartItemRequest req) {
        return cart.updateItem(p.getId(), id, req.quantity());
    }

    @DeleteMapping("/items/{id}")
    public CartDto remove(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        return cart.removeItem(p.getId(), id);
    }

    @DeleteMapping
    public CartDto clear(@AuthenticationPrincipal UserPrincipal p) {
        return cart.clear(p.getId());
    }
}
