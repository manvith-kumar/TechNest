package com.technest.controller;

import com.technest.dto.CommonDtos.MessageResponse;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.ReviewDtos.*;
import com.technest.security.UserPrincipal;
import com.technest.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {
    private final ReviewService reviews;

    public ReviewController(ReviewService reviews) {
        this.reviews = reviews;
    }

    @GetMapping("/products/{productId}/reviews")
    public PageResponse<ReviewDto> list(@PathVariable Long productId, @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "5") int size) {
        return reviews.listForProduct(productId, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 20),
                Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/products/{productId}/reviews/summary")
    public ReviewSummaryDto summary(@PathVariable Long productId) {
        return reviews.summary(productId);
    }

    @GetMapping("/products/{productId}/reviews/eligibility")
    public ReviewEligibilityDto eligibility(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long productId) {
        return reviews.eligibility(p.getId(), productId);
    }

    @PostMapping("/products/{productId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto create(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long productId,
                            @Valid @RequestBody ReviewRequest req) {
        return reviews.create(p.getId(), productId, req);
    }

    @PutMapping("/reviews/{id}")
    public ReviewDto update(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody ReviewRequest req) {
        return reviews.update(p.getId(), id, req);
    }

    @DeleteMapping("/reviews/{id}")
    public MessageResponse delete(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        reviews.deleteOwn(p.getId(), id);
        return new MessageResponse("Review deleted.");
    }

    @PostMapping("/reviews/{id}/report")
    public MessageResponse report(@PathVariable Long id) {
        reviews.report(id);
        return new MessageResponse("Thanks. Our team will take a look at this review.");
    }
}
