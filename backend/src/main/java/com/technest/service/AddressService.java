package com.technest.service;

import com.technest.dto.CartDtos.AddressDto;
import com.technest.dto.CartDtos.AddressRequest;
import java.util.List;

public interface AddressService {
    List<AddressDto> list(Long userId);

    AddressDto create(Long userId, AddressRequest request);

    AddressDto update(Long userId, Long id, AddressRequest request);

    void delete(Long userId, Long id);
}
