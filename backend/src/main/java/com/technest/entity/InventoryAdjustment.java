package com.technest.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.technest.enums.*;

@Entity
@Table(name = "inventory_adjustments")
@Getter
@Setter
@NoArgsConstructor
public class InventoryAdjustment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false)
    private int delta;

    @Column(name = "quantity_after", nullable = false)
    private int quantityAfter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StockReason reason;

    @Column(length = 300)
    private String note;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
