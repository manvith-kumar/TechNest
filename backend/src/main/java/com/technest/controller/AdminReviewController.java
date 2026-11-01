package com.technest.controller;

import com.technest.dto.CommonDtos.MessageResponse;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.ReviewDtos.ReviewDto;
import com.technest.service.ReviewService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {
    private final ReviewService reviews;

    public AdminReviewController(ReviewService reviews) {
        this.reviews = reviews;
    }

    @GetMapping
    public PageResponse<ReviewDto> list(@RequestParam(required = false) Boolean reported, @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "10") int size) {
        return reviews.adminList(reported, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @DeleteMapping("/{id}")
    public MessageResponse delete(@PathVariable Long id) {
        reviews.adminDelete(id);
        return new MessageResponse("Review removed.");
    }

    @PatchMapping("/{id}/dismiss-report")
    public MessageResponse dismiss(@PathVariable Long id) {
        reviews.adminDismissReport(id);
        return new MessageResponse("Report dismissed.");
    }
}
