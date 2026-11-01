package com.technest.service.impl;

import com.technest.dto.AdminDtos.CustomerDetailDto;
import com.technest.dto.AdminDtos.CustomerDto;
import com.technest.dto.AuthDtos.ChangePasswordRequest;
import com.technest.dto.AuthDtos.UpdateProfileRequest;
import com.technest.dto.AuthDtos.UserDto;
import com.technest.dto.CommonDtos.PageResponse;
import com.technest.entity.User;
import com.technest.enums.OrderStatus;
import com.technest.enums.Role;
import com.technest.exception.BadRequestException;
import com.technest.exception.ResourceNotFoundException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.AddressRepository;
import com.technest.repository.OrderRepository;
import com.technest.repository.RefreshTokenRepository;
import com.technest.repository.UserRepository;
import com.technest.service.UserService;
import java.util.Locale;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository users;
    private final OrderRepository orders;
    private final AddressRepository addresses;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder encoder;
    private final EntityMapper mapper;

    public UserServiceImpl(UserRepository users, OrderRepository orders, AddressRepository addresses,
                           RefreshTokenRepository refreshTokens, PasswordEncoder encoder, EntityMapper mapper) {
        this.users = users;
        this.orders = orders;
        this.addresses = addresses;
        this.refreshTokens = refreshTokens;
        this.encoder = encoder;
        this.mapper = mapper;
    }

    private User load(Long id) {
        return users.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getProfile(Long userId) {
        return mapper.toUserDto(load(userId));
    }

    @Override
    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest req) {
        User u = load(userId);
        u.setFullName(req.fullName().trim());
        u.setPhone(req.phone() == null || req.phone().isBlank() ? null : req.phone().trim());
        return mapper.toUserDto(u);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest req) {
        User u = load(userId);
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash())) {
            throw new BadRequestException("Your current password is incorrect.");
        }
        if (encoder.matches(req.newPassword(), u.getPasswordHash())) {
            throw new BadRequestException("Choose a password you have not used before.");
        }
        u.setPasswordHash(encoder.encode(req.newPassword()));
        refreshTokens.revokeAllForUser(userId);
    }

    private CustomerDto toCustomer(User u) {
        long count = orders.countByUserId(u.getId());
        return new CustomerDto(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.isEnabled(), u.getCreatedAt(),
                count, orders.sumSpentByUser(u.getId(), OrderStatus.CANCELLED));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CustomerDto> listCustomers(String q, Pageable pageable) {
        String like = "%" + (q == null ? "" : q.trim().toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")) + "%";
        return PageResponse.of(users.search(Role.CUSTOMER, like, pageable), this::toCustomer);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailDto getCustomer(Long id) {
        User u = load(id);
        if (u.getRole() != Role.CUSTOMER) throw new ResourceNotFoundException("Customer not found.");
        var recent = orders.findByUserId(id, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "placedAt")))
                .map(o -> mapper.toOrderDto(o, java.util.Set.of())).getContent();
        var addrs = addresses.findByUserIdOrderByDefaultAddressDescIdAsc(id).stream().map(mapper::toAddressDto).toList();
        return new CustomerDetailDto(toCustomer(u), addrs, recent);
    }

    @Override
    @Transactional
    public CustomerDto setCustomerEnabled(Long id, boolean enabled) {
        User u = load(id);
        if (u.getRole() != Role.CUSTOMER) throw new BadRequestException("Only customer accounts can be activated or deactivated.");
        u.setEnabled(enabled);
        if (!enabled) refreshTokens.revokeAllForUser(id);
        return toCustomer(u);
    }
}
