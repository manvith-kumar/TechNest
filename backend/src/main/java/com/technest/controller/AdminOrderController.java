package com.technest.controller;

import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.OrderDtos.OrderDto;
import com.technest.dto.OrderDtos.UpdateOrderStatusRequest;
import com.technest.enums.OrderStatus;
import com.technest.security.UserPrincipal;
import com.technest.service.OrderService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {
    private final OrderService orders;

    public AdminOrderController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping
    public PageResponse<OrderDto> list(@RequestParam(required = false) OrderStatus status, @RequestParam(required = false) String q,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                                       @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        return orders.adminList(status, q, from, to, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "placedAt")));
    }

    @GetMapping("/{id}")
    public OrderDto get(@PathVariable Long id) {
        return orders.adminGet(id);
    }

    @PutMapping("/{id}/status")
    public OrderDto updateStatus(@AuthenticationPrincipal UserPrincipal admin, @PathVariable Long id,
                                 @Valid @RequestBody UpdateOrderStatusRequest req) {
        return orders.adminUpdateStatus(admin.getId(), id, req);
    }

    @PostMapping("/{id}/cancel")
    public OrderDto cancel(@AuthenticationPrincipal UserPrincipal admin, @PathVariable Long id) {
        return orders.adminUpdateStatus(admin.getId(), id, new UpdateOrderStatusRequest(OrderStatus.CANCELLED, null));
    }
}
