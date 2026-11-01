package com.technest.dto;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

public final class CommonDtos {
    private CommonDtos() {}

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {
        public static <S, T> PageResponse<T> of(Page<S> page, Function<S, T> mapper) {
            return new PageResponse<>(page.getContent().stream().map(mapper).toList(), page.getNumber(), page.getSize(),
                    page.getTotalElements(), page.getTotalPages(), page.isLast());
        }
    }

    public record MessageResponse(String message) {}

    public record NewsletterRequest(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Email
                                    @jakarta.validation.constraints.Size(max = 190) String email) {}
}
