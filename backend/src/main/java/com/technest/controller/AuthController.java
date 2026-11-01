package com.technest.controller;

import com.technest.dto.AuthDtos.*;
import com.technest.dto.CommonDtos.MessageResponse;
import com.technest.security.RefreshCookieService;
import com.technest.service.AuthService;
import com.technest.service.AuthService.AuthResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService auth;
    private final RefreshCookieService cookies;

    public AuthController(AuthService auth, RefreshCookieService cookies) {
        this.auth = auth;
        this.cookies = cookies;
    }

    private ResponseEntity<AuthResponse> respond(HttpStatus status, AuthResult r) {
        return ResponseEntity.status(status).header(HttpHeaders.SET_COOKIE, cookies.create(r.refreshToken()).toString()).body(r.response());
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return respond(HttpStatus.CREATED, auth.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return respond(HttpStatus.OK, auth.login(req));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@CookieValue(name = RefreshCookieService.NAME, required = false) String token,
                                                HttpServletRequest request) {
        cookies.requireAjaxHeader(request);
        return respond(HttpStatus.OK, auth.refresh(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@CookieValue(name = RefreshCookieService.NAME, required = false) String token,
                                                  HttpServletRequest request) {
        cookies.requireAjaxHeader(request);
        auth.logout(token);
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookies.clear().toString()).body(new MessageResponse("Signed out."));
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgot(@Valid @RequestBody ForgotPasswordRequest req) {
        auth.forgotPassword(req.email());
        return new MessageResponse("If an account exists for that email, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public MessageResponse reset(@Valid @RequestBody ResetPasswordRequest req) {
        auth.resetPassword(req);
        return new MessageResponse("Your password has been updated. You can sign in now.");
    }
}
