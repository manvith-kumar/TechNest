package com.technest.service;

import com.technest.dto.CatalogDtos.*;
import com.technest.dto.CommonDtos.PageResponse;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface ProductService {
    PageResponse<ProductSummary> search(ProductFilter filter, String sort, int page, int size);

    ProductDetail get(Long id, boolean includeInactive);

    List<ProductSummary> collection(String type, int limit);

    List<ProductSummary> related(Long id, int limit);

    List<String> brands();

    CompareResponse compare(List<Long> ids);

    ProductDetail create(ProductRequest request);

    ProductDetail update(Long id, ProductRequest request);

    DeleteProductResult delete(Long id);
}
