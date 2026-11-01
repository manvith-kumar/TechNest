package com.technest.service;

import com.technest.dto.AuthDtos.*;
import com.technest.entity.User;

public interface AuthService {
    /** The refresh token is returned separately so the controller can place it in an HttpOnly cookie. */
    record AuthResult(AuthResponse response, String refreshToken) {}

    AuthResult register(RegisterRequest request);

    AuthResult login(LoginRequest request);

    AuthResult refresh(String refreshToken);

    void logout(String refreshToken);

    void forgotPassword(String email);

    void resetPassword(ResetPasswordRequest request);

    /** Issues a brand-new session (used after a password change, which revokes all older sessions). */
    AuthResult issueSession(Long userId);
}
