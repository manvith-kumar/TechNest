package com.technest.unit;

import static org.junit.jupiter.api.Assertions.*;

import com.technest.config.AppProperties;
import com.technest.entity.User;
import com.technest.enums.Role;
import com.technest.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.util.List;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
    private static AppProperties props(String secret, long minutes) {
        return new AppProperties(new AppProperties.Jwt(secret, minutes, 7, false), new AppProperties.Cors(List.of()),
                null, null, null);
    }

    private static User user() {
        User u = new User();
        u.setId(42L);
        u.setRole(Role.ADMIN);
        return u;
    }

    @Test
    void roundTripsClaims() {
        JwtService jwt = new JwtService(props("unit-test-secret-unit-test-secret-1234567890", 15));
        Claims c = jwt.parse(jwt.generateAccessToken(user()));
        assertEquals("42", c.getSubject());
        assertEquals("ADMIN", c.get("role", String.class));
    }

    @Test
    void rejectsTamperedToken() {
        JwtService jwt = new JwtService(props("unit-test-secret-unit-test-secret-1234567890", 15));
        String token = jwt.generateAccessToken(user());
        assertThrows(JwtException.class, () -> jwt.parse(token.substring(0, token.length() - 3) + "abc"));
    }

    @Test
    void rejectsTokenSignedWithAnotherSecret() {
        String token = new JwtService(props("another-secret-another-secret-1234567890!!", 15)).generateAccessToken(user());
        JwtService jwt = new JwtService(props("unit-test-secret-unit-test-secret-1234567890", 15));
        assertThrows(JwtException.class, () -> jwt.parse(token));
    }

    @Test
    void refusesWeakOrPlaceholderSecrets() {
        assertThrows(IllegalStateException.class, () -> new JwtService(props("short", 15)));
        assertThrows(IllegalStateException.class, () -> new JwtService(props("CHANGE_ME_replace_with_a_long_random_secret_of_at_least_32_chars", 15)));
    }
}
