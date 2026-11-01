package com.technest.controller;

import com.technest.dto.CatalogDtos.CategoryDto;
import com.technest.dto.CatalogDtos.CategoryRequest;
import com.technest.dto.CommonDtos.MessageResponse;
import com.technest.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {
    private final CategoryService categories;

    public AdminCategoryController(CategoryService categories) {
        this.categories = categories;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryDto create(@Valid @RequestBody CategoryRequest req) {
        return categories.create(req);
    }

    @PutMapping("/{id}")
    public CategoryDto update(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        return categories.update(id, req);
    }

    @DeleteMapping("/{id}")
    public MessageResponse delete(@PathVariable Long id, @RequestParam(required = false) Long reassignTo) {
        categories.delete(id, reassignTo);
        return new MessageResponse("Category deleted.");
    }
}
