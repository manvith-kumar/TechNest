package com.technest.dto;

import com.technest.enums.OrderStatus;
import com.technest.enums.PaymentMethod;
import com.technest.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {
    private OrderDtos() {}

    /** Totals are never accepted from the client: they are recomputed on the server from current prices. */
    public record CreateOrderRequest(
            @NotNull Long addressId,
            @NotNull PaymentMethod paymentMethod,
            List<Long> cartItemIds,
            @Size(max = 80) String idempotencyKey,
            Boolean simulatePaymentFailure) {}

    public record OrderItemDto(Long id, Long productId, String name, String imageUrl, BigDecimal unitPrice,
                               BigDecimal originalPrice, int quantity, BigDecimal lineTotal, boolean reviewed) {}

    public record PaymentDto(Long id, PaymentMethod method, PaymentStatus status, BigDecimal amount,
                             String transactionRef, boolean simulated, LocalDateTime paidAt) {}

    public record StatusHistoryDto(OrderStatus status, String note, LocalDateTime createdAt) {}

    public record ShippingAddressDto(String name, String phone, String line1, String line2, String city, String state,
                                     String postalCode, String country) {}

    public record OrderCustomerDto(Long id, String name, String email, String phone) {}

    public record OrderDto(Long id, String orderNumber, OrderStatus status, BigDecimal subtotal, BigDecimal discountTotal,
                           BigDecimal shippingFee, BigDecimal totalAmount, LocalDateTime placedAt, LocalDateTime updatedAt,
                           ShippingAddressDto shippingAddress, List<OrderItemDto> items, PaymentDto payment,
                           List<StatusHistoryDto> history, boolean customerCancellable, List<OrderStatus> nextStatuses,
                           OrderCustomerDto customer) {}

    public record UpdateOrderStatusRequest(@NotNull OrderStatus status, @Size(max = 300) String note) {}
}
