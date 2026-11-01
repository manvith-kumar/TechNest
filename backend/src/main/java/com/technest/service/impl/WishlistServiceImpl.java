package com.technest.service.impl;

import com.technest.dto.CartDtos.WishlistItemDto;
import com.technest.entity.Product;
import com.technest.entity.WishlistItem;
import com.technest.exception.ResourceNotFoundException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.ProductRepository;
import com.technest.repository.UserRepository;
import com.technest.repository.WishlistRepository;
import com.technest.service.WishlistService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WishlistServiceImpl implements WishlistService {
    private final WishlistRepository wishlist;
    private final ProductRepository products;
    private final UserRepository users;
    private final EntityMapper mapper;

    public WishlistServiceImpl(WishlistRepository wishlist, ProductRepository products, UserRepository users, EntityMapper mapper) {
        this.wishlist = wishlist;
        this.products = products;
        this.users = users;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WishlistItemDto> list(Long userId) {
        return wishlist.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(w -> w.getProduct().isActive())
                .map(w -> new WishlistItemDto(mapper.toSummary(w.getProduct()), w.getCreatedAt())).toList();
    }

    @Override
    @Transactional
    public List<WishlistItemDto> add(Long userId, Long productId) {
        Product p = products.findByIdAndActiveTrue(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        if (!wishlist.existsByUserIdAndProductId(userId, productId)) {   // idempotent
            WishlistItem w = new WishlistItem();
            w.setUser(users.getReferenceById(userId));
            w.setProduct(p);
            wishlist.saveAndFlush(w);
        }
        return list(userId);
    }

    @Override
    @Transactional
    public List<WishlistItemDto> remove(Long userId, Long productId) {
        wishlist.findByUserIdAndProductId(userId, productId).ifPresent(wishlist::delete);   // idempotent
        wishlist.flush();
        return list(userId);
    }
}
