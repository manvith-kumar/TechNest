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
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@BatchSize(size = 50)
@org.hibernate.annotations.DynamicUpdate   // never rewrite stock_quantity from a stale in-memory value
public class Product extends Auditable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 220, unique = true)
    private String slug;

    @Column(nullable = false, length = 80)
    private String brand;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "discount_price", precision = 12, scale = 2)
    private BigDecimal discountPrice;

    /** Generated column in MySQL: COALESCE(discount_price, price). Used for sorting and price filters. */
    @Column(name = "effective_price", insertable = false, updatable = false, precision = 12, scale = 2)
    private BigDecimal effectivePrice;

    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity;

    @Column(name = "low_stock_threshold", nullable = false)
    private int lowStockThreshold = 5;

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "rating_avg", nullable = false, precision = 3, scale = 2)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount;

    @Column(name = "sold_count", nullable = false)
    private int soldCount;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @BatchSize(size = 50)
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC, id ASC")
    @BatchSize(size = 50)
    private List<ProductSpecification> specifications = new ArrayList<>();

    /** The price a customer pays right now. */
    public BigDecimal currentPrice() {
        return discountPrice != null ? discountPrice : price;
    }

    public void replaceImages(List<ProductImage> next) {
        images.clear();
        for (int i = 0; i < next.size(); i++) {
            ProductImage img = next.get(i);
            img.setProduct(this);
            img.setSortOrder(i);
            images.add(img);
        }
    }

    public void replaceSpecifications(List<ProductSpecification> next) {
        specifications.clear();
        for (int i = 0; i < next.size(); i++) {
            ProductSpecification s = next.get(i);
            s.setProduct(this);
            s.setSortOrder(i);
            specifications.add(s);
        }
    }
}
