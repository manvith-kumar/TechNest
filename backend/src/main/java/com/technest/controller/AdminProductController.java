package com.technest.controller;

import com.technest.dto.CatalogDtos.*;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.service.ProductService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {
    private final ProductService products;

    public AdminProductController(ProductService products) {
        this.products = products;
    }

    @GetMapping
    public PageResponse<ProductSummary> list(@RequestParam(required = false) String q, @RequestParam(required = false) Long categoryId,
                                             @RequestParam(required = false) List<String> brand, @RequestParam(required = false) Boolean active,
                                             @RequestParam(required = false) Boolean featured,
                                             @RequestParam(required = false) BigDecimal minPrice, @RequestParam(required = false) BigDecimal maxPrice,
                                             @RequestParam(defaultValue = "newest") String sort,
                                             @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        ProductFilter f = new ProductFilter(q, categoryId, brand, minPrice, maxPrice, null, null, featured, null, true, active);
        return products.search(f, sort, page, size);
    }

    @GetMapping("/{id}")
    public ProductDetail get(@PathVariable Long id) {
        return products.get(id, true);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductDetail create(@Valid @RequestBody ProductRequest req) {
        return products.create(req);
    }

    @PutMapping("/{id}")
    public ProductDetail update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return products.update(id, req);
    }

    @DeleteMapping("/{id}")
    public DeleteProductResult delete(@PathVariable Long id) {
        return products.delete(id);
    }
}
