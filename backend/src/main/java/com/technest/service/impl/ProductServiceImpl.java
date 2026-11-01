package com.technest.service.impl;

import com.technest.dto.CatalogDtos.*;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.entity.Category;
import com.technest.entity.Product;
import com.technest.entity.ProductImage;
import com.technest.entity.ProductSpecification;
import com.technest.exception.BadRequestException;
import com.technest.exception.ResourceNotFoundException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.CategoryRepository;
import com.technest.repository.OrderItemRepository;
import com.technest.repository.ProductRepository;
import com.technest.repository.ProductSpecs;
import com.technest.service.InventoryService;
import com.technest.service.ProductService;
import com.technest.enums.StockReason;
import com.technest.util.SlugUtil;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductServiceImpl implements ProductService {
    private static final int MAX_PAGE_SIZE = 48;

    @PersistenceContext
    private EntityManager em;

    private final ProductRepository products;
    private final CategoryRepository categories;
    private final OrderItemRepository orderItems;
    private final InventoryService inventory;
    private final EntityMapper mapper;

    public ProductServiceImpl(ProductRepository products, CategoryRepository categories, OrderItemRepository orderItems,
                              InventoryService inventory, EntityMapper mapper) {
        this.products = products;
        this.categories = categories;
        this.orderItems = orderItems;
        this.inventory = inventory;
        this.mapper = mapper;
    }

    private Sort sortFor(String sort) {
        Sort s;
        switch (sort == null ? "newest" : sort) {
            case "price_asc":  s = Sort.by(Sort.Order.asc("effectivePrice")); break;
            case "price_desc": s = Sort.by(Sort.Order.desc("effectivePrice")); break;
            case "popular":    s = Sort.by(Sort.Order.desc("soldCount"), Sort.Order.desc("ratingCount")); break;
            case "rating":     s = Sort.by(Sort.Order.desc("ratingAvg"), Sort.Order.desc("ratingCount")); break;
            case "name":       s = Sort.by(Sort.Order.asc("name")); break;
            default:           s = Sort.by(Sort.Order.desc("createdAt"));
        }
        return s.and(Sort.by(Sort.Order.desc("id")));   // stable paging
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> search(ProductFilter filter, String sort, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE), sortFor(sort));
        Page<Product> result = products.findAll(ProductSpecs.of(filter), pageable);
        return PageResponse.of(result, mapper::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetail get(Long id, boolean includeInactive) {
        Product p = includeInactive ? products.findById(id).orElse(null) : products.findByIdAndActiveTrue(id).orElse(null);
        if (p == null) throw new ResourceNotFoundException("Product not found.");
        return mapper.toDetail(p);
    }

    private static ProductFilter publicFilter() {
        return new ProductFilter(null, null, null, null, null, null, null, null, null, false, null);
    }

    private static ProductFilter filter(Boolean inStock, Boolean featured, Boolean onSale) {
        return new ProductFilter(null, null, null, null, null, null, inStock, featured, onSale, false, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummary> collection(String type, int limit) {
        int n = Math.min(Math.max(limit, 1), 24);
        Sort sort;
        ProductFilter f;
        switch (type) {
            case "featured":
                f = filter(null, true, null);
                sort = Sort.by(Sort.Order.desc("ratingAvg"), Sort.Order.desc("soldCount"), Sort.Order.desc("id"));
                break;
            case "trending":
                f = filter(true, null, null);
                sort = Sort.by(Sort.Order.desc("ratingCount"), Sort.Order.desc("ratingAvg"), Sort.Order.desc("id"));
                break;
            case "best-sellers":
                f = filter(true, null, null);
                sort = Sort.by(Sort.Order.desc("soldCount"), Sort.Order.desc("id"));
                break;
            case "new-arrivals":
                f = publicFilter();
                sort = Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
                break;
            case "recommended":
                f = filter(true, null, null);
                sort = Sort.by(Sort.Order.desc("ratingAvg"), Sort.Order.desc("ratingCount"), Sort.Order.desc("id"));
                break;
            case "deals": {
                // Largest percentage discount first. Computed in memory over the (small) set of discounted products.
                List<ProductSummary> deals = new ArrayList<>(products.findAll(ProductSpecs.of(filter(true, null, true)),
                        PageRequest.of(0, 100, Sort.by(Sort.Order.desc("id")))).map(mapper::toSummary).getContent());
                deals.sort(Comparator.comparingInt(ProductSummary::discountPercent).reversed());
                return deals.size() > n ? deals.subList(0, n) : deals;
            }
            default:
                throw new ResourceNotFoundException("Unknown collection.");
        }
        return products.findAll(ProductSpecs.of(f), PageRequest.of(0, n, sort)).map(mapper::toSummary).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductSummary> related(Long id, int limit) {
        Product p = products.findByIdAndActiveTrue(id).orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        ProductFilter f = new ProductFilter(null, p.getCategory().getId(), null, null, null, null, null, null, null, false, null);
        int n = Math.min(Math.max(limit, 1), 12);
        return products.findAll(ProductSpecs.of(f), PageRequest.of(0, n + 1, sortFor("popular"))).getContent().stream()
                .filter(x -> !x.getId().equals(id)).limit(n).map(mapper::toSummary).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> brands() {
        return products.findActiveBrands();
    }

    @Override
    @Transactional(readOnly = true)
    public CompareResponse compare(List<Long> ids) {
        if (ids == null || ids.size() < 2 || ids.size() > 4) {
            throw new BadRequestException("Select between 2 and 4 products to compare.");
        }
        List<Product> found = new ArrayList<>();
        for (Long id : new LinkedHashSet<>(ids)) {
            found.add(products.findByIdAndActiveTrue(id).orElseThrow(() -> new ResourceNotFoundException("Product " + id + " was not found.")));
        }
        if (found.size() < 2) throw new BadRequestException("Select at least 2 different products to compare.");
        Long categoryId = found.get(0).getCategory().getId();
        for (Product p : found) {
            if (!p.getCategory().getId().equals(categoryId)) {
                throw new BadRequestException("Only products from the same category can be compared.");
            }
        }
        Set<String> keys = new LinkedHashSet<>();
        for (Product p : found) for (ProductSpecification s : p.getSpecifications()) keys.add(s.getSpecKey());
        return new CompareResponse(found.stream().map(mapper::toDetail).toList(), new ArrayList<>(keys));
    }

    // ------------------------------------------------------------------ admin

    private void validatePrices(ProductRequest r) {
        if (r.discountPrice() != null && r.discountPrice().compareTo(r.price()) >= 0) {
            throw new BadRequestException("The discount price must be lower than the regular price.");
        }
    }

    private void apply(Product p, ProductRequest r, Category category) {
        p.setName(r.name().trim());
        p.setBrand(r.brand().trim());
        p.setCategory(category);
        p.setDescription(r.description().trim());
        p.setPrice(r.price());
        p.setDiscountPrice(r.discountPrice());
        p.setLowStockThreshold(r.lowStockThreshold() == null ? 5 : r.lowStockThreshold());
        p.setFeatured(Boolean.TRUE.equals(r.featured()));
        p.setActive(r.active() == null || r.active());
        List<ProductImage> images = new ArrayList<>();
        for (ImageDto dto : r.images()) {
            ProductImage img = new ProductImage();
            img.setUrl(dto.url().trim());
            img.setAltText(dto.altText() == null || dto.altText().isBlank() ? p.getName() : dto.altText().trim());
            images.add(img);
        }
        p.replaceImages(images);
        List<ProductSpecification> specs = new ArrayList<>();
        if (r.specifications() != null) {
            for (SpecDto dto : r.specifications()) {
                ProductSpecification s = new ProductSpecification();
                s.setSpecKey(dto.key().trim());
                s.setSpecValue(dto.value().trim());
                specs.add(s);
            }
        }
        p.replaceSpecifications(specs);
    }

    private Category category(Long id) {
        return categories.findById(id).orElseThrow(() -> new BadRequestException("The selected category does not exist."));
    }

    @Override
    @Transactional
    public ProductDetail create(ProductRequest r) {
        validatePrices(r);
        Product p = new Product();
        apply(p, r, category(r.categoryId()));
        p.setSlug(SlugUtil.unique(SlugUtil.slugify(p.getName()), products::existsBySlug));
        p.setStockQuantity(r.stockQuantity());
        products.saveAndFlush(p);
        em.refresh(p);
        if (r.stockQuantity() > 0) {
            inventory.recordChange(p.getId(), r.stockQuantity(), StockReason.INITIAL, "Opening stock", null, null);
        }
        return mapper.toDetail(p);
    }

    @Override
    @Transactional
    public ProductDetail update(Long id, ProductRequest r) {
        validatePrices(r);
        Product p = products.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        apply(p, r, category(r.categoryId()));
        int current = p.getStockQuantity();
        if (r.stockQuantity() != current) {
            // Stock edits go through the atomic helpers so they stay safe next to concurrent orders.
            int delta = r.stockQuantity() - current;
            if (delta > 0) {
                products.incrementStock(id, delta);
            } else if (products.decrementStock(id, -delta) == 0) {
                throw new BadRequestException("Stock changed while you were editing. Reload the product and try again.");
            }
            inventory.recordChange(id, delta, StockReason.ADJUSTMENT, "Edited in product form", null, null);
        }
        products.saveAndFlush(p);
        em.refresh(p);   // pick up the atomically-updated stock and the generated effective_price
        return mapper.toDetail(p);
    }

    @Override
    @Transactional
    public DeleteProductResult delete(Long id) {
        Product p = products.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        if (orderItems.existsByProductId(id)) {
            // Order history must keep pointing at the product, so hide it instead of deleting it.
            p.setActive(false);
            return new DeleteProductResult(false, true,
                    "This product appears in past orders, so it was deactivated instead of deleted.");
        }
        products.delete(p);
        return new DeleteProductResult(true, false, "Product deleted.");
    }
}
