package com.technest.service.impl;

import com.technest.config.AppProperties;
import com.technest.dto.AuthDtos.*;
import com.technest.entity.PasswordResetToken;
import com.technest.entity.RefreshToken;
import com.technest.entity.User;
import com.technest.enums.Role;
import com.technest.exception.BadRequestException;
import com.technest.exception.ConflictException;
import com.technest.exception.UnauthorizedException;
import com.technest.mapper.EntityMapper;
import com.technest.repository.PasswordResetTokenRepository;
import com.technest.repository.RefreshTokenRepository;
import com.technest.repository.UserRepository;
import com.technest.security.JwtService;
import com.technest.security.LoginAttemptService;
import com.technest.service.AuthService;
import com.technest.util.HashUtil;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final LoginAttemptService attempts;
    private final EntityMapper mapper;
    private final AppProperties props;
    /** Compared against when the email is unknown so response time does not reveal which emails exist. */
    private final String dummyHash;

    public AuthServiceImpl(UserRepository users, RefreshTokenRepository refreshTokens,
                           PasswordResetTokenRepository resetTokens, PasswordEncoder encoder, JwtService jwt,
                           LoginAttemptService attempts, EntityMapper mapper, AppProperties props) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.resetTokens = resetTokens;
        this.encoder = encoder;
        this.jwt = jwt;
        this.attempts = attempts;
        this.mapper = mapper;
        this.props = props;
        this.dummyHash = encoder.encode(UUID.randomUUID().toString());
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthResult issue(User user) {
        String raw = HashUtil.randomToken();
        RefreshToken t = new RefreshToken();
        t.setUser(user);
        t.setTokenHash(HashUtil.sha256Hex(raw));
        t.setExpiresAt(LocalDateTime.now().plusDays(props.jwt().refreshTokenDays()));
        refreshTokens.save(t);
        AuthResponse body = new AuthResponse(jwt.generateAccessToken(user), jwt.accessTokenSeconds(), mapper.toUserDto(user));
        return new AuthResult(body, raw);
    }

    @Override
    @Transactional
    public AuthResult register(RegisterRequest req) {
        String email = normalize(req.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists.");
        }
        User u = new User();
        u.setFullName(req.fullName().trim());
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(req.password()));
        u.setPhone(req.phone() == null || req.phone().isBlank() ? null : req.phone().trim());
        u.setRole(Role.CUSTOMER);   // role is never taken from the request
        users.save(u);
        return issue(u);
    }

    @Override
    @Transactional
    public AuthResult login(LoginRequest req) {
        String email = normalize(req.email());
        attempts.assertNotLocked(email);
        User user = users.findByEmailIgnoreCase(email).orElse(null);
        boolean ok = encoder.matches(req.password(), user != null ? user.getPasswordHash() : dummyHash);
        if (user == null || !ok) {
            attempts.recordFailure(email);
            throw new BadCredentialsException("Invalid email or password.");
        }
        if (!user.isEnabled()) throw new DisabledException("Account disabled");
        attempts.recordSuccess(email);
        return issue(user);
    }

    /** noRollbackFor: the reuse-detection revocation below must be committed even though we throw. */
    @Override
    @Transactional(noRollbackFor = UnauthorizedException.class)
    public AuthResult refresh(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) throw new UnauthorizedException("Please sign in again.");
        RefreshToken t = refreshTokens.findByTokenHash(HashUtil.sha256Hex(rawToken))
                .orElseThrow(() -> new UnauthorizedException("Please sign in again."));
        User user = t.getUser();
        if (t.isRevoked()) {
            // A rotated token was presented again: assume theft and end every session for this user.
            refreshTokens.revokeAllForUser(user.getId());
            throw new UnauthorizedException("Please sign in again.");
        }
        if (t.getExpiresAt().isBefore(LocalDateTime.now()) || !user.isEnabled()) {
            throw new UnauthorizedException("Your session has expired. Please sign in again.");
        }
        t.setRevoked(true);
        return issue(user);
    }

    @Override
    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        refreshTokens.findByTokenHash(HashUtil.sha256Hex(rawToken)).ifPresent(t -> t.setRevoked(true));
    }

    @Override
    @Transactional
    public void forgotPassword(String email) {
        // Always returns normally so the endpoint cannot be used to discover registered emails.
        users.findByEmailIgnoreCase(normalize(email)).filter(User::isEnabled).ifPresent(user -> {
            resetTokens.invalidateAllForUser(user.getId());
            String raw = HashUtil.randomToken();
            PasswordResetToken t = new PasswordResetToken();
            t.setUser(user);
            t.setTokenHash(HashUtil.sha256Hex(raw));
            t.setExpiresAt(LocalDateTime.now().plusHours(1));
            resetTokens.save(t);
            if (props.auth().logResetLinks()) {
                log.info("[DEV ONLY] Password reset link for {}: {}/reset-password?token={}", user.getEmail(),
                        props.auth().frontendUrl(), raw);
            }
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        PasswordResetToken t = resetTokens.findByTokenHash(HashUtil.sha256Hex(req.token()))
                .filter(x -> !x.isUsed() && x.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new BadRequestException("This reset link is invalid or has expired."));
        User user = t.getUser();
        user.setPasswordHash(encoder.encode(req.newPassword()));
        t.setUsed(true);
        refreshTokens.revokeAllForUser(user.getId());
        attempts.recordSuccess(user.getEmail());
    }

    @Override
    @Transactional
    public AuthResult issueSession(Long userId) {
        return issue(users.findById(userId).orElseThrow(() -> new UnauthorizedException("Please sign in again.")));
    }
}
