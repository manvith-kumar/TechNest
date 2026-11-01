package com.technest.service.impl;

import com.technest.dto.CartDtos.AddressDto;
import com.technest.dto.CartDtos.AddressRequest;
import com.technest.entity.Address;
import com.technest.exception.BadRequestException;
import com.technest.exception.ResourceNotFoundException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.AddressRepository;
import com.technest.repository.UserRepository;
import com.technest.service.AddressService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AddressServiceImpl implements AddressService {
    private static final int MAX_ADDRESSES = 10;

    private final AddressRepository addresses;
    private final UserRepository users;
    private final EntityMapper mapper;

    public AddressServiceImpl(AddressRepository addresses, UserRepository users, EntityMapper mapper) {
        this.addresses = addresses;
        this.users = users;
        this.mapper = mapper;
    }

    private Address owned(Long userId, Long id) {
        // Looked up by (id, user) so another customer's address id is indistinguishable from a missing one.
        return addresses.findByIdAndUserId(id, userId).orElseThrow(() -> new ResourceNotFoundException("Address not found."));
    }

    private void apply(Address a, AddressRequest r) {
        a.setLabel(r.label().trim());
        a.setRecipientName(r.recipientName().trim());
        a.setPhone(r.phone().trim());
        a.setLine1(r.line1().trim());
        a.setLine2(r.line2() == null || r.line2().isBlank() ? null : r.line2().trim());
        a.setCity(r.city().trim());
        a.setState(r.state().trim());
        a.setPostalCode(r.postalCode().trim());
        a.setCountry(r.country() == null || r.country().isBlank() ? "India" : r.country().trim());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDto> list(Long userId) {
        return addresses.findByUserIdOrderByDefaultAddressDescIdAsc(userId).stream().map(mapper::toAddressDto).toList();
    }

    @Override
    @Transactional
    public AddressDto create(Long userId, AddressRequest r) {
        long count = addresses.countByUserId(userId);
        if (count >= MAX_ADDRESSES) throw new BadRequestException("You can save up to " + MAX_ADDRESSES + " addresses.");
        Address a = new Address();
        a.setUser(users.getReferenceById(userId));
        apply(a, r);
        boolean makeDefault = count == 0 || Boolean.TRUE.equals(r.defaultAddress());
        if (makeDefault) addresses.clearDefaults(userId);
        a.setDefaultAddress(makeDefault);
        return mapper.toAddressDto(addresses.save(a));
    }

    @Override
    @Transactional
    public AddressDto update(Long userId, Long id, AddressRequest r) {
        Address a = owned(userId, id);
        apply(a, r);
        if (Boolean.TRUE.equals(r.defaultAddress()) && !a.isDefaultAddress()) {
            addresses.clearDefaults(userId);
            a.setDefaultAddress(true);
        }
        return mapper.toAddressDto(a);
    }

    @Override
    @Transactional
    public void delete(Long userId, Long id) {
        Address a = owned(userId, id);
        boolean wasDefault = a.isDefaultAddress();
        addresses.delete(a);
        addresses.flush();
        if (wasDefault) {   // promote the oldest remaining address so checkout always has a default
            addresses.findByUserIdOrderByDefaultAddressDescIdAsc(userId).stream().findFirst()
                    .ifPresent(next -> next.setDefaultAddress(true));
        }
    }
}
