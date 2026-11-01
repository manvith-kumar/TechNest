package com.technest.controller;

import com.technest.dto.CartDtos.WishlistItemDto;
import com.technest.security.UserPrincipal;
import com.technest.service.WishlistService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wishlist")
public class WishlistController {
    private final WishlistService wishlist;

    public WishlistController(WishlistService wishlist) {
        this.wishlist = wishlist;
    }

    @GetMapping
    public List<WishlistItemDto> list(@AuthenticationPrincipal UserPrincipal p) {
        return wishlist.list(p.getId());
    }

    @PostMapping("/{productId}")
    public List<WishlistItemDto> add(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long productId) {
        return wishlist.add(p.getId(), productId);
    }

    @DeleteMapping("/{productId}")
    public List<WishlistItemDto> remove(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long productId) {
        return wishlist.remove(p.getId(), productId);
    }
}
