package com.technest.security;

import com.technest.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

/** Not a Spring bean on purpose: it is created inside the security filter chain so it runs exactly once. */
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    public static final String ERROR_ATTR = "technest.jwt.error";

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = header.substring(7).trim();
            try {
                Claims claims = jwtService.parse(token);
                Long userId = Long.valueOf(claims.getSubject());
                // Loaded on every request so role changes and deactivated accounts take effect immediately.
                users.findById(userId).filter(u -> u.isEnabled()).ifPresent(user -> {
                    UserPrincipal principal = new UserPrincipal(user);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            } catch (ExpiredJwtException e) {
                request.setAttribute(ERROR_ATTR, "expired");
            } catch (JwtException | IllegalArgumentException e) {
                request.setAttribute(ERROR_ATTR, "invalid");
            }
        }
        chain.doFilter(request, response);
    }
}
