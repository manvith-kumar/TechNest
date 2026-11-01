package com.technest.controller;

import com.technest.dto.AdminDtos.CustomerDetailDto;
import com.technest.dto.AdminDtos.CustomerDto;
import com.technest.dto.AdminDtos.UpdateCustomerStatusRequest;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/customers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomerController {
    private final UserService users;

    public AdminCustomerController(UserService users) {
        this.users = users;
    }

    @GetMapping
    public PageResponse<CustomerDto> list(@RequestParam(required = false) String q, @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        return users.listCustomers(q, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public CustomerDetailDto get(@PathVariable Long id) {
        return users.getCustomer(id);
    }

    @PatchMapping("/{id}/status")
    public CustomerDto setStatus(@PathVariable Long id, @Valid @RequestBody UpdateCustomerStatusRequest req) {
        return users.setCustomerEnabled(id, req.enabled());
    }
}
