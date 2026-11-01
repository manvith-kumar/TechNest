package com.technest.service.impl;

import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.ReviewDtos.*;
import com.technest.entity.Product;
import com.technest.entity.Review;
import com.technest.enums.OrderStatus;
import com.technest.exception.ConflictException;
import com.technest.exception.ForbiddenException;
import com.technest.exception.ResourceNotFoundException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.OrderItemRepository;
import com.technest.repository.ProductRepository;
import com.technest.repository.ReviewRepository;
import com.technest.repository.UserRepository;
import com.technest.service.ReviewService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewServiceImpl implements ReviewService {
    private final ReviewRepository reviews;
    private final ProductRepository products;
    private final OrderItemRepository orderItems;
    private final UserRepository users;
    private final EntityMapper mapper;

    public ReviewServiceImpl(ReviewRepository reviews, ProductRepository products, OrderItemRepository orderItems,
                             UserRepository users, EntityMapper mapper) {
        this.reviews = reviews;
        this.products = products;
        this.orderItems = orderItems;
        this.users = users;
        this.mapper = mapper;
    }

    private static String clean(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private void refreshAggregate(Long productId) {
        Double avg = reviews.averageRating(productId);
        long count = reviews.countByProductId(productId);
        BigDecimal rounded = BigDecimal.valueOf(avg == null ? 0 : avg).setScale(2, RoundingMode.HALF_UP);
        products.updateRating(productId, rounded, (int) count);
    }

    private Review ownReview(Long userId, Long reviewId) {
        Review r = reviews.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Review not found."));
        if (!r.getUser().getId().equals(userId)) throw new ForbiddenException("You can only change your own reviews.");
        return r;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewDto> listForProduct(Long productId, Pageable pageable) {
        return PageResponse.of(reviews.findByProductId(productId, pageable), mapper::toReviewDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewSummaryDto summary(Long productId) {
        Map<Integer, Long> dist = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) dist.put(i, 0L);
        for (Object[] row : reviews.ratingDistribution(productId)) dist.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        Double avg = reviews.averageRating(productId);
        return new ReviewSummaryDto(avg == null ? 0 : Math.round(avg * 100.0) / 100.0, reviews.countByProductId(productId), dist);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewEligibilityDto eligibility(Long userId, Long productId) {
        Optional<Review> existing = reviews.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) return new ReviewEligibilityDto(false, true, existing.get().getId(), "You have already reviewed this product.");
        boolean bought = orderItems.countPurchases(userId, productId, OrderStatus.DELIVERED) > 0;
        return bought ? new ReviewEligibilityDto(true, false, null, null)
                : new ReviewEligibilityDto(false, false, null, "You can review this product once an order containing it has been delivered.");
    }

    @Override
    @Transactional
    public ReviewDto create(Long userId, Long productId, ReviewRequest req) {
        Product p = products.findByIdAndActiveTrue(productId).orElseThrow(() -> new ResourceNotFoundException("Product not found."));
        if (orderItems.countPurchases(userId, productId, OrderStatus.DELIVERED) == 0) {
            throw new ForbiddenException("You can review a product after an order containing it has been delivered.");
        }
        if (reviews.existsByUserIdAndProductId(userId, productId)) {
            throw new ConflictException("You have already reviewed this product. Edit your existing review instead.");
        }
        Review r = new Review();
        r.setProduct(p);
        r.setUser(users.getReferenceById(userId));
        r.setRating(req.rating());
        r.setTitle(clean(req.title()));
        r.setComment(clean(req.comment()));
        reviews.saveAndFlush(r);
        refreshAggregate(productId);
        return mapper.toReviewDto(r);
    }

    @Override
    @Transactional
    public ReviewDto update(Long userId, Long reviewId, ReviewRequest req) {
        Review r = ownReview(userId, reviewId);
        r.setRating(req.rating());
        r.setTitle(clean(req.title()));
        r.setComment(clean(req.comment()));
        reviews.saveAndFlush(r);
        refreshAggregate(r.getProduct().getId());
        return mapper.toReviewDto(r);
    }

    @Override
    @Transactional
    public void deleteOwn(Long userId, Long reviewId) {
        Review r = ownReview(userId, reviewId);
        Long pid = r.getProduct().getId();
        reviews.delete(r);
        reviews.flush();
        refreshAggregate(pid);
    }

    @Override
    @Transactional
    public void report(Long reviewId) {
        Review r = reviews.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Review not found."));
        r.setReported(true);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewDto> adminList(Boolean reportedOnly, Pageable pageable) {
        return PageResponse.of(Boolean.TRUE.equals(reportedOnly) ? reviews.findByReported(true, pageable) : reviews.findAll(pageable),
                mapper::toReviewDto);
    }

    @Override
    @Transactional
    public void adminDelete(Long reviewId) {
        Review r = reviews.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Review not found."));
        Long pid = r.getProduct().getId();
        reviews.delete(r);
        reviews.flush();
        refreshAggregate(pid);
    }

    @Override
    @Transactional
    public void adminDismissReport(Long reviewId) {
        reviews.findById(reviewId).orElseThrow(() -> new ResourceNotFoundException("Review not found.")).setReported(false);
    }
}
