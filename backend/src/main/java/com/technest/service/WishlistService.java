package com.technest.service;

import com.technest.dto.CartDtos.WishlistItemDto;
import java.util.List;

public interface WishlistService {
    List<WishlistItemDto> list(Long userId);

    List<WishlistItemDto> add(Long userId, Long productId);

    List<WishlistItemDto> remove(Long userId, Long productId);
}
