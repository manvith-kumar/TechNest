package com.technest.security;

import com.technest.config.AppProperties;
import com.technest.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/**
 * The refresh token lives only in an HttpOnly, SameSite=Strict cookie scoped to /api/v1/auth, so page scripts can never
 * read it. The short-lived access token is kept in memory by the frontend.
 */
@Component
public class RefreshCookieService {
    public static final String NAME = "technest_refresh";

    private final AppProperties props;

    public RefreshCookieService(AppProperties props) {
        this.props = props;
    }

    public ResponseCookie create(String rawToken) {
        return ResponseCookie.from(NAME, rawToken).httpOnly(true).secure(props.jwt().cookieSecure()).sameSite("Strict")
                .path("/api/v1/auth").maxAge(Duration.ofDays(props.jwt().refreshTokenDays())).build();
    }

    public ResponseCookie clear() {
        return ResponseCookie.from(NAME, "").httpOnly(true).secure(props.jwt().cookieSecure()).sameSite("Strict")
                .path("/api/v1/auth").maxAge(Duration.ZERO).build();
    }

    /** Cookie-authenticated endpoints need a custom header, which browsers will not attach to cross-site form posts. */
    public void requireAjaxHeader(HttpServletRequest request) {
        if (request.getHeader("X-Requested-With") == null) {
            throw new ForbiddenException("Invalid request.");
        }
    }
}
