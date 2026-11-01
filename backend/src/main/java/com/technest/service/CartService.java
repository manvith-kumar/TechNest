package com.technest.service;

import com.technest.dto.CartDtos.CartDto;

public interface CartService {
    CartDto getCart(Long userId);

    CartDto addItem(Long userId, Long productId, int quantity);

    CartDto updateItem(Long userId, Long itemId, int quantity);

    CartDto removeItem(Long userId, Long itemId);

    CartDto clear(Long userId);
}
