package com.technest.service;

import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.OrderDtos.*;
import com.technest.enums.OrderStatus;
import java.time.LocalDate;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    OrderDto place(Long userId, CreateOrderRequest request);

    PageResponse<OrderDto> myOrders(Long userId, Pageable pageable);

    OrderDto getMine(Long userId, Long orderId);

    OrderDto cancelMine(Long userId, Long orderId);

    PageResponse<OrderDto> adminList(OrderStatus status, String q, LocalDate from, LocalDate to, Pageable pageable);

    OrderDto adminGet(Long orderId);

    OrderDto adminUpdateStatus(Long adminId, Long orderId, UpdateOrderStatusRequest request);
}
