package com.technest.controller;

import com.technest.dto.CommonDtos.PageResponse;
import com.technest.dto.OrderDtos.CreateOrderRequest;
import com.technest.dto.OrderDtos.OrderDto;
import com.technest.security.UserPrincipal;
import com.technest.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final OrderService orders;

    public OrderController(OrderService orders) {
        this.orders = orders;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDto place(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody CreateOrderRequest req,
                          @RequestHeader(value = "Idempotency-Key", required = false) String headerKey) {
        CreateOrderRequest effective = req;
        if (req.idempotencyKey() == null && headerKey != null) {
            effective = new CreateOrderRequest(req.addressId(), req.paymentMethod(), req.cartItemIds(), headerKey, req.simulatePaymentFailure());
        }
        return orders.place(p.getId(), effective);
    }

    @GetMapping("/my-orders")
    public PageResponse<OrderDto> mine(@AuthenticationPrincipal UserPrincipal p, @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "10") int size) {
        return orders.myOrders(p.getId(), PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "placedAt")));
    }

    @GetMapping("/{id}")
    public OrderDto get(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        return orders.getMine(p.getId(), id);
    }

    @PostMapping("/{id}/cancel")
    public OrderDto cancel(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        return orders.cancelMine(p.getId(), id);
    }
}
