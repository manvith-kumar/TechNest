package com.technest.security;

import com.technest.config.AppProperties;
import com.technest.exception.TooManyRequestsException;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/** In-memory brute-force protection. Resets on restart; use a shared store when running several instances. */
@Service
public class LoginAttemptService {
    private static final class Attempt {
        int failures;
        Instant lockedUntil;
    }

    private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final int maxFailures;
    private final int lockoutMinutes;

    public LoginAttemptService(AppProperties props) {
        this.maxFailures = props.auth().maxFailedLogins();
        this.lockoutMinutes = props.auth().lockoutMinutes();
    }

    private static String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public void assertNotLocked(String email) {
        Attempt a = attempts.get(key(email));
        if (a != null && a.lockedUntil != null) {
            if (Instant.now().isBefore(a.lockedUntil)) {
                throw new TooManyRequestsException("Too many failed sign-in attempts. Try again in " + lockoutMinutes + " minutes.");
            }
            attempts.remove(key(email));
        }
    }

    public void recordFailure(String email) {
        attempts.compute(key(email), (k, a) -> {
            Attempt next = a == null ? new Attempt() : a;
            next.failures++;
            if (next.failures >= maxFailures) next.lockedUntil = Instant.now().plusSeconds(lockoutMinutes * 60L);
            return next;
        });
    }

    public void recordSuccess(String email) {
        attempts.remove(key(email));
    }
}
