package com.technest.controller;

import com.technest.dto.CatalogDtos.*;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.service.ProductService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService products;

    public ProductController(ProductService products) {
        this.products = products;
    }

    /** Paginated, filterable, sortable catalogue. sort: newest | price_asc | price_desc | popular | rating | name */
    @GetMapping
    public PageResponse<ProductSummary> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) List<String> brand,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) BigDecimal minRating,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean onSale,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        ProductFilter f = new ProductFilter(q, categoryId, brand, minPrice, maxPrice, minRating, inStock, featured, onSale, false, null);
        return products.search(f, sort, page, size);
    }

    @GetMapping("/search")
    public PageResponse<ProductSummary> search(@RequestParam String q, @RequestParam(defaultValue = "newest") String sort,
                                               @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return products.search(new ProductFilter(q, null, null, null, null, null, null, null, null, false, null), sort, page, size);
    }

    @GetMapping("/featured")
    public List<ProductSummary> featured(@RequestParam(defaultValue = "8") int limit) {
        return products.collection("featured", limit);
    }

    /** type: featured | trending | best-sellers | new-arrivals | deals | recommended */
    @GetMapping("/collections/{type}")
    public List<ProductSummary> collection(@PathVariable String type, @RequestParam(defaultValue = "8") int limit) {
        return products.collection(type, limit);
    }

    @GetMapping("/brands")
    public List<String> brands() {
        return products.brands();
    }

    @GetMapping("/compare")
    public CompareResponse compare(@RequestParam List<Long> ids) {
        return products.compare(ids);
    }

    @GetMapping("/category/{categoryId}")
    public PageResponse<ProductSummary> byCategory(@PathVariable Long categoryId, @RequestParam(defaultValue = "newest") String sort,
                                                   @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "12") int size) {
        return products.search(new ProductFilter(null, categoryId, null, null, null, null, null, null, null, false, null), sort, page, size);
    }

    @GetMapping("/{id}")
    public ProductDetail get(@PathVariable Long id) {
        return products.get(id, false);
    }

    @GetMapping("/{id}/related")
    public List<ProductSummary> related(@PathVariable Long id, @RequestParam(defaultValue = "4") int limit) {
        return products.related(id, limit);
    }
}
