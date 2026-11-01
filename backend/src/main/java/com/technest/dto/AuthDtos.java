package com.technest.dto;

import com.technest.enums.Role;
import com.technest.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public final class AuthDtos {
    private AuthDtos() {}

    public static final String PHONE_REGEX = "^$|^[+0-9][0-9 ()-]{6,18}$";

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 120) String fullName,
            @NotBlank @Email @Size(max = 190) String email,
            @NotBlank @StrongPassword String password,
            @Pattern(regexp = PHONE_REGEX, message = "Enter a valid phone number.") String phone) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record UserDto(Long id, String fullName, String email, String phone, Role role, boolean enabled,
                          LocalDateTime createdAt) {}

    public record AuthResponse(String accessToken, long expiresInSeconds, UserDto user) {}

    public record ForgotPasswordRequest(@NotBlank @Email String email) {}

    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @StrongPassword String newPassword) {}

    public record UpdateProfileRequest(
            @NotBlank @Size(min = 2, max = 120) String fullName,
            @Pattern(regexp = PHONE_REGEX, message = "Enter a valid phone number.") String phone) {}

    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank @StrongPassword String newPassword) {}
}
