package com.technest.controller;

import com.technest.dto.AuthDtos.*;
import com.technest.security.RefreshCookieService;
import com.technest.security.UserPrincipal;
import com.technest.service.AuthService;
import com.technest.service.AuthService.AuthResult;
import com.technest.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {
    private final UserService users;
    private final AuthService auth;
    private final RefreshCookieService cookies;

    public UserController(UserService users, AuthService auth, RefreshCookieService cookies) {
        this.users = users;
        this.auth = auth;
        this.cookies = cookies;
    }

    @GetMapping
    public UserDto me(@AuthenticationPrincipal UserPrincipal p) {
        return users.getProfile(p.getId());
    }

    @PutMapping
    public UserDto update(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody UpdateProfileRequest req) {
        return users.updateProfile(p.getId(), req);
    }

    /** Changing the password ends every other session, so this device is given a fresh one. */
    @PutMapping("/password")
    public ResponseEntity<AuthResponse> changePassword(@AuthenticationPrincipal UserPrincipal p,
                                                       @Valid @RequestBody ChangePasswordRequest req) {
        users.changePassword(p.getId(), req);
        AuthResult r = auth.issueSession(p.getId());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookies.create(r.refreshToken()).toString()).body(r.response());
    }
}
