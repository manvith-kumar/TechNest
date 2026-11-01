package com.technest.service;

import com.technest.dto.AdminDtos.CustomerDetailDto;
import com.technest.dto.AdminDtos.CustomerDto;
import com.technest.dto.AuthDtos.ChangePasswordRequest;
import com.technest.dto.AuthDtos.UpdateProfileRequest;
import com.technest.dto.AuthDtos.UserDto;
import com.technest.dto.CommonDtos.PageResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserDto getProfile(Long userId);

    UserDto updateProfile(Long userId, UpdateProfileRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);

    PageResponse<CustomerDto> listCustomers(String q, Pageable pageable);

    CustomerDetailDto getCustomer(Long id);

    CustomerDto setCustomerEnabled(Long id, boolean enabled);
}
