package com.technest.dto;

import com.technest.enums.StockReason;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() {}

    private static final String URL_RULE = "^(https?://|/uploads/).{3,}$";

    public record CategoryDto(Long id, String name, String slug, String description, String imageUrl, long productCount) {}

    public record CategoryRequest(
            @NotBlank @Size(max = 100) String name,
            @Size(max = 500) String description,
            @Size(max = 1000) @Pattern(regexp = "^$|" + URL_RULE, message = "Use an http(s) URL or an uploaded image.") String imageUrl) {}

    public record ImageDto(
            @NotBlank @Size(max = 1000) @Pattern(regexp = URL_RULE, message = "Use an http(s) URL or an uploaded image.") String url,
            @Size(max = 200) String altText) {}

    public record SpecDto(@NotBlank @Size(max = 100) String key, @NotBlank @Size(max = 300) String value) {}

    public record ProductSummary(Long id, String name, String slug, String brand, Long categoryId, String categoryName,
                                 String imageUrl, BigDecimal price, BigDecimal discountPrice, BigDecimal currentPrice,
                                 int discountPercent, BigDecimal ratingAvg, int ratingCount, int stockQuantity,
                                 boolean inStock, boolean lowStock, boolean featured, boolean active, int soldCount) {}

    public record ProductDetail(Long id, String name, String slug, String brand, Long categoryId, String categoryName,
                                String description, BigDecimal price, BigDecimal discountPrice, BigDecimal currentPrice,
                                int discountPercent, BigDecimal ratingAvg, int ratingCount, int stockQuantity,
                                int lowStockThreshold, boolean inStock, boolean lowStock, boolean featured, boolean active,
                                int soldCount, List<ImageDto> images, List<SpecDto> specifications,
                                LocalDateTime createdAt) {}

    public record ProductRequest(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Size(max = 80) String brand,
            @NotNull Long categoryId,
            @NotBlank @Size(max = 5000) String description,
            @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal price,
            @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal discountPrice,
            @NotNull @Min(0) @Max(1000000) Integer stockQuantity,
            @Min(0) @Max(100000) Integer lowStockThreshold,
            Boolean featured,
            Boolean active,
            @NotEmpty @Size(max = 10) List<@Valid ImageDto> images,
            @Size(max = 40) List<@Valid SpecDto> specifications) {}

    /** Public catalogue filters. Admin lists set includeInactive. */
    public record ProductFilter(String q, Long categoryId, List<String> brands, BigDecimal minPrice, BigDecimal maxPrice,
                                BigDecimal minRating, Boolean inStock, Boolean featured, Boolean onSale,
                                boolean includeInactive, Boolean active) {}

    public record CompareResponse(List<ProductDetail> products, List<String> specKeys) {}

    public record DeleteProductResult(boolean deleted, boolean deactivated, String message) {}

    public record StockAdjustRequest(
            @NotNull @Min(-100000) @Max(100000) Integer delta,
            @NotNull StockReason reason,
            @Size(max = 300) String note) {}

    public record InventoryRow(Long productId, String name, String brand, String categoryName, String imageUrl,
                               int stockQuantity, int lowStockThreshold, String status, boolean active) {}

    public record InventoryHistoryDto(Long id, int delta, int quantityAfter, StockReason reason, String note, Long orderId,
                                      LocalDateTime createdAt) {}
}
