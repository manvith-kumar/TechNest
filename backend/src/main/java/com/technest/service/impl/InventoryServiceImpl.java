package com.technest.service.impl;

import com.technest.dto.CatalogDtos.InventoryHistoryDto;
import com.technest.dto.CatalogDtos.InventoryRow;
import com.technest.dto.CatalogDtos.StockAdjustRequest;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.entity.InventoryAdjustment;
import com.technest.entity.Product;
import com.technest.enums.StockReason;
import com.technest.exception.BadRequestException;
import com.technest.exception.ResourceNotFoundException;
import com.technest.repository.InventoryAdjustmentRepository;
import com.technest.repository.ProductRepository;
import com.technest.repository.ProductSpecs;
import com.technest.service.InventoryService;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryServiceImpl implements InventoryService {
    private final ProductRepository products;
    private final InventoryAdjustmentRepository history;

    public InventoryServiceImpl(ProductRepository products, InventoryAdjustmentRepository history) {
        this.products = products;
        this.history = history;
    }

    private static String status(int stock, int threshold) {
        return stock == 0 ? "OUT" : stock <= threshold ? "LOW" : "IN_STOCK";
    }

    private InventoryRow row(Product p, int stock) {
        String image = p.getImages().isEmpty() ? null : p.getImages().get(0).getUrl();
        return new InventoryRow(p.getId(), p.getName(), p.getBrand(), p.getCategory().getName(), image, stock,
                p.getLowStockThreshold(), status(stock, p.getLowStockThreshold()), p.isActive());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryRow> list(String q, String status, Pageable pageable) {
        return PageResponse.of(products.findAll(ProductSpecs.inventory(q, status), pageable), p -> row(p, p.getStockQuantity()));
    }

    @Override
    @Transactional
    public InventoryRow adjust(Long productId, StockAdjustRequest req, Long adminId) {
        Product p = products.findById(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        if (req.reason() != StockReason.RESTOCK && req.reason() != StockReason.ADJUSTMENT) {
            throw new BadRequestException("Reason must be RESTOCK or ADJUSTMENT.");
        }
        int delta = req.delta();
        if (delta == 0) throw new BadRequestException("Enter a non-zero quantity change.");
        if (delta > 0) {
            products.incrementStock(productId, delta);
        } else if (products.decrementStock(productId, -delta) == 0) {
            throw new BadRequestException("Stock cannot go below zero. Current stock is " + products.findStock(productId) + ".");
        }
        recordChange(productId, delta, req.reason(), req.note(), null, adminId);
        return row(p, products.findStock(productId));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryHistoryDto> history(Long productId, Pageable pageable) {
        if (!products.existsById(productId)) throw new ResourceNotFoundException("Product not found.");
        return PageResponse.of(history.findByProductIdOrderByCreatedAtDescIdDesc(productId, pageable),
                h -> new InventoryHistoryDto(h.getId(), h.getDelta(), h.getQuantityAfter(), h.getReason(), h.getNote(),
                        h.getOrderId(), h.getCreatedAt()));
    }

    @Override
    @Transactional
    public void recordChange(Long productId, int delta, StockReason reason, String note, Long orderId, Long actorId) {
        Integer after = products.findStock(productId);   // reads the value written by this transaction
        InventoryAdjustment a = new InventoryAdjustment();
        a.setProductId(productId);
        a.setDelta(delta);
        a.setQuantityAfter(after == null ? 0 : after);
        a.setReason(reason);
        a.setNote(note == null || note.isBlank() ? null : note.trim());
        a.setOrderId(orderId);
        a.setCreatedBy(actorId);
        history.save(a);
    }
}
