package com.technest.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {
    private CartDtos() {}

    public record CartItemDto(Long id, Long productId, String name, String slug, String brand, String imageUrl,
                              BigDecimal unitPrice, BigDecimal originalPrice, int quantity, BigDecimal lineTotal,
                              int stockQuantity, boolean available) {}

    public record CartDto(Long id, List<CartItemDto> items, int itemCount, BigDecimal subtotal, BigDecimal savings,
                          BigDecimal shippingFee, BigDecimal total, BigDecimal freeShippingThreshold,
                          BigDecimal flatShippingFee, boolean checkoutBlocked) {}

    public record AddCartItemRequest(@NotNull Long productId, @NotNull @Min(1) @Max(10) Integer quantity) {}

    public record UpdateCartItemRequest(@NotNull @Min(1) @Max(10) Integer quantity) {}

    public record WishlistItemDto(CatalogDtos.ProductSummary product, java.time.LocalDateTime addedAt) {}

    public record AddressDto(Long id, String label, String recipientName, String phone, String line1, String line2,
                             String city, String state, String postalCode, String country, boolean defaultAddress) {}

    public record AddressRequest(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 40) String label,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 120) String recipientName,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp = AuthDtos.PHONE_REGEX, message = "Enter a valid phone number.") String phone,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 200) String line1,
            @jakarta.validation.constraints.Size(max = 200) String line2,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 100) String city,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 100) String state,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp = "^[A-Za-z0-9 -]{3,12}$", message = "Enter a valid postal code.") String postalCode,
            @jakarta.validation.constraints.Size(max = 80) String country,
            Boolean defaultAddress) {}
}
