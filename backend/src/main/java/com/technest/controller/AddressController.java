package com.technest.controller;

import com.technest.dto.CartDtos.AddressDto;
import com.technest.dto.CartDtos.AddressRequest;
import com.technest.dto.CommonDtos.MessageResponse;
import com.technest.security.UserPrincipal;
import com.technest.service.AddressService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/addresses")
public class AddressController {
    private final AddressService addresses;

    public AddressController(AddressService addresses) {
        this.addresses = addresses;
    }

    @GetMapping
    public List<AddressDto> list(@AuthenticationPrincipal UserPrincipal p) {
        return addresses.list(p.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressDto create(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody AddressRequest req) {
        return addresses.create(p.getId(), req);
    }

    @PutMapping("/{id}")
    public AddressDto update(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody AddressRequest req) {
        return addresses.update(p.getId(), id, req);
    }

    @DeleteMapping("/{id}")
    public MessageResponse delete(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        addresses.delete(p.getId(), id);
        return new MessageResponse("Address removed.");
    }
}
