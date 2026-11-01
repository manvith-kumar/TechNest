package com.technest.repository;

import com.technest.entity.InventoryAdjustment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryAdjustmentRepository extends JpaRepository<InventoryAdjustment, Long> {
    Page<InventoryAdjustment> findByProductIdOrderByCreatedAtDescIdDesc(Long productId, Pageable pageable);
}
