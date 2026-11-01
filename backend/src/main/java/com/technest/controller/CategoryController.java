package com.technest.controller;

import com.technest.dto.CatalogDtos.CategoryDto;
import com.technest.service.CategoryService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    private final CategoryService categories;

    public CategoryController(CategoryService categories) {
        this.categories = categories;
    }

    @GetMapping
    public List<CategoryDto> list() {
        return categories.list();
    }

    @GetMapping("/{id}")
    public CategoryDto get(@PathVariable Long id) {
        return categories.get(id);
    }
}
