package com.technest.service;

import com.technest.dto.CatalogDtos.InventoryHistoryDto;
import com.technest.dto.CatalogDtos.InventoryRow;
import com.technest.dto.CatalogDtos.StockAdjustRequest;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.enums.StockReason;
import org.springframework.data.domain.Pageable;

public interface InventoryService {
    PageResponse<InventoryRow> list(String q, String status, Pageable pageable);

    InventoryRow adjust(Long productId, StockAdjustRequest request, Long adminId);

    PageResponse<InventoryHistoryDto> history(Long productId, Pageable pageable);

    /** Writes a history row for a stock change that has already been applied. Must run inside the same transaction. */
    void recordChange(Long productId, int delta, StockReason reason, String note, Long orderId, Long actorId);
}
