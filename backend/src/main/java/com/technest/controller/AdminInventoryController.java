package com.technest.controller;

import com.technest.dto.CatalogDtos.InventoryHistoryDto;
import com.technest.dto.CatalogDtos.InventoryRow;
import com.technest.dto.CatalogDtos.StockAdjustRequest;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.security.UserPrincipal;
import com.technest.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryController {
    private final InventoryService inventory;

    public AdminInventoryController(InventoryService inventory) {
        this.inventory = inventory;
    }

    /** status: all | low | out | in */
    @GetMapping
    public PageResponse<InventoryRow> list(@RequestParam(required = false) String q, @RequestParam(defaultValue = "all") String status,
                                           @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return inventory.list(q, status, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Order.asc("stockQuantity"), Sort.Order.asc("name"))));
    }

    @PostMapping("/{productId}/adjust")
    public InventoryRow adjust(@AuthenticationPrincipal UserPrincipal admin, @PathVariable Long productId,
                               @Valid @RequestBody StockAdjustRequest req) {
        return inventory.adjust(productId, req, admin.getId());
    }

    @GetMapping("/{productId}/history")
    public PageResponse<InventoryHistoryDto> history(@PathVariable Long productId, @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return inventory.history(productId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50)));
    }
}
