package com.technest.service;

import com.technest.dto.CatalogDtos.CategoryDto;
import com.technest.dto.CatalogDtos.CategoryRequest;
import java.util.List;

public interface CategoryService {
    List<CategoryDto> list();

    CategoryDto get(Long id);

    CategoryDto create(CategoryRequest request);

    CategoryDto update(Long id, CategoryRequest request);

    /** Refuses to delete a category that still has products unless reassignTo is supplied. */
    void delete(Long id, Long reassignTo);
}
