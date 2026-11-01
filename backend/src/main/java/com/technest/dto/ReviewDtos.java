package com.technest.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.Map;

public final class ReviewDtos {
    private ReviewDtos() {}

    public record ReviewDto(Long id, Long productId, String productName, Long userId, String userName, int rating,
                            String title, String comment, boolean reported, LocalDateTime createdAt,
                            LocalDateTime updatedAt) {}

    public record ReviewRequest(@NotNull @Min(1) @Max(5) Integer rating, @Size(max = 150) String title,
                                @Size(max = 2000) String comment) {}

    public record ReviewSummaryDto(double average, long count, Map<Integer, Long> distribution) {}

    public record ReviewEligibilityDto(boolean canReview, boolean hasReview, Long reviewId, String reason) {}
}
