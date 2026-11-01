package com.technest.service.impl;

import com.technest.dto.CatalogDtos.CategoryDto;
import com.technest.dto.CatalogDtos.CategoryRequest;
import com.technest.entity.Category;
import com.technest.exception.ConflictException;
import com.technest.exception.ResourceNotFoundException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.CategoryRepository;
import com.technest.repository.ProductRepository;
import com.technest.service.CategoryService;
import com.technest.util.SlugUtil;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categories;
    private final ProductRepository products;
    private final EntityMapper mapper;

    public CategoryServiceImpl(CategoryRepository categories, ProductRepository products, EntityMapper mapper) {
        this.categories = categories;
        this.products = products;
        this.mapper = mapper;
    }

    private Category load(Long id) {
        return categories.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category not found."));
    }

    private static String clean(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> list() {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : products.countGroupedByCategory()) counts.put((Long) row[0], ((Number) row[1]).longValue());
        return categories.findAllByOrderByNameAsc().stream()
                .map(c -> mapper.toCategoryDto(c, counts.getOrDefault(c.getId(), 0L))).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDto get(Long id) {
        Category c = load(id);
        return mapper.toCategoryDto(c, products.countByCategoryId(id));
    }

    @Override
    @Transactional
    public CategoryDto create(CategoryRequest req) {
        String name = req.name().trim();
        if (categories.existsByNameIgnoreCase(name)) throw new ConflictException("A category named \"" + name + "\" already exists.");
        Category c = new Category();
        c.setName(name);
        c.setSlug(SlugUtil.unique(SlugUtil.slugify(name), categories::existsBySlug));
        c.setDescription(clean(req.description()));
        c.setImageUrl(clean(req.imageUrl()));
        categories.save(c);
        return mapper.toCategoryDto(c, 0);
    }

    @Override
    @Transactional
    public CategoryDto update(Long id, CategoryRequest req) {
        Category c = load(id);
        String name = req.name().trim();
        categories.findByNameIgnoreCase(name).filter(o -> !o.getId().equals(id))
                .ifPresent(o -> { throw new ConflictException("A category named \"" + name + "\" already exists."); });
        c.setName(name);
        c.setDescription(clean(req.description()));
        c.setImageUrl(clean(req.imageUrl()));
        return mapper.toCategoryDto(c, products.countByCategoryId(id));
    }

    @Override
    @Transactional
    public void delete(Long id, Long reassignTo) {
        Category c = load(id);
        long count = products.countByCategoryId(id);
        if (count > 0) {
            if (reassignTo == null) {
                throw new ConflictException("This category still has " + count + " product(s). Move them to another category first.");
            }
            if (reassignTo.equals(id)) throw new ConflictException("Choose a different category to move the products to.");
            Category target = load(reassignTo);
            products.reassignCategory(c, target);
        }
        categories.delete(c);
    }
}
