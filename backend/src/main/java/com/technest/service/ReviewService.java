package com.technest.service;

import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.ReviewDtos.*;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    PageResponse<ReviewDto> listForProduct(Long productId, Pageable pageable);

    ReviewSummaryDto summary(Long productId);

    ReviewEligibilityDto eligibility(Long userId, Long productId);

    ReviewDto create(Long userId, Long productId, ReviewRequest request);

    ReviewDto update(Long userId, Long reviewId, ReviewRequest request);

    void deleteOwn(Long userId, Long reviewId);

    void report(Long reviewId);

    PageResponse<ReviewDto> adminList(Boolean reportedOnly, Pageable pageable);

    void adminDelete(Long reviewId);

    void adminDismissReport(Long reviewId);
}
