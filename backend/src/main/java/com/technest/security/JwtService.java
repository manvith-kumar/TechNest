package com.technest.security;

import com.technest.config.AppProperties;
import com.technest.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private static final String ISSUER = "technest";

    private final SecretKey key;
    private final long accessMinutes;

    public JwtService(AppProperties props) {
        String secret = props.jwt().secret();
        if (secret == null || secret.length() < 32 || secret.startsWith("CHANGE_ME")) {
            throw new IllegalStateException("JWT_SECRET must be set to a random value of at least 32 characters. "
                    + "Copy backend/.env.example to backend/.env and generate one with: openssl rand -base64 48");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessMinutes = props.jwt().accessTokenMinutes();
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(ISSUER)
                .subject(String.valueOf(user.getId()))
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public long accessTokenSeconds() {
        return accessMinutes * 60;
    }

    /** Throws JwtException (including ExpiredJwtException) when the token is invalid. */
    public Claims parse(String token) throws JwtException {
        return Jwts.parser().verifyWith(key).requireIssuer(ISSUER).build().parseSignedClaims(token).getPayload();
    }
}
