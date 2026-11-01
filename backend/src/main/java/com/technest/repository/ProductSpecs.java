package com.technest.repository;

import com.technest.dto.CatalogDtos.ProductFilter;
import com.technest.entity.Category;
import com.technest.entity.Product;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

public final class ProductSpecs {
    private ProductSpecs() {}

    private static String escapeLike(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    /** Every search word must match the product name, brand or category name. */
    public static Specification<Product> of(ProductFilter f) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (!f.includeInactive()) {
                ps.add(cb.isTrue(root.<Boolean>get("active")));
            } else if (f.active() != null) {
                ps.add(cb.equal(root.<Boolean>get("active"), f.active()));
            }
            if (f.q() != null && !f.q().isBlank()) {
                Join<Product, Category> cat = root.join("category", JoinType.LEFT);
                for (String token : f.q().trim().toLowerCase(Locale.ROOT).split("\\s+")) {
                    String like = "%" + escapeLike(token) + "%";
                    ps.add(cb.or(
                            cb.like(cb.lower(root.<String>get("name")), like, '\\'),
                            cb.like(cb.lower(root.<String>get("brand")), like, '\\'),
                            cb.like(cb.lower(cat.<String>get("name")), like, '\\')));
                }
            }
            if (f.categoryId() != null) {
                ps.add(cb.equal(root.get("category").<Long>get("id"), f.categoryId()));
            }
            if (f.brands() != null && !f.brands().isEmpty()) {
                List<String> lower = f.brands().stream().map(b -> b.toLowerCase(Locale.ROOT)).toList();
                ps.add(cb.lower(root.<String>get("brand")).in(lower));
            }
            if (f.minPrice() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("effectivePrice"), f.minPrice()));
            }
            if (f.maxPrice() != null) {
                ps.add(cb.lessThanOrEqualTo(root.<BigDecimal>get("effectivePrice"), f.maxPrice()));
            }
            if (f.minRating() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.<BigDecimal>get("ratingAvg"), f.minRating()));
            }
            if (Boolean.TRUE.equals(f.inStock())) {
                ps.add(cb.greaterThan(root.<Integer>get("stockQuantity"), 0));
            }
            if (Boolean.TRUE.equals(f.featured())) {
                ps.add(cb.isTrue(root.<Boolean>get("featured")));
            }
            if (Boolean.TRUE.equals(f.onSale())) {
                ps.add(cb.isNotNull(root.get("discountPrice")));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    /** Admin inventory view: status is "low", "out" or "in" (anything else = all). */
    public static Specification<Product> inventory(String q, String status) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + escapeLike(q.trim().toLowerCase(Locale.ROOT)) + "%";
                ps.add(cb.or(cb.like(cb.lower(root.<String>get("name")), like, '\\'),
                        cb.like(cb.lower(root.<String>get("brand")), like, '\\')));
            }
            if ("out".equals(status)) {
                ps.add(cb.equal(root.<Integer>get("stockQuantity"), 0));
            } else if ("low".equals(status)) {
                ps.add(cb.greaterThan(root.<Integer>get("stockQuantity"), 0));
                ps.add(cb.le(root.<Integer>get("stockQuantity"), root.<Integer>get("lowStockThreshold")));
            } else if ("in".equals(status)) {
                ps.add(cb.gt(root.<Integer>get("stockQuantity"), root.<Integer>get("lowStockThreshold")));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }
}
