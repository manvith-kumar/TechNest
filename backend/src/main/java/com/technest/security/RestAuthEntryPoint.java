package com.technest.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.technest.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/** Returns JSON 401 responses with a message that distinguishes expired tokens from missing or invalid ones. */
@Component
public class RestAuthEntryPoint implements AuthenticationEntryPoint {
    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule())
            .disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex)
            throws IOException {
        Object reason = request.getAttribute(JwtAuthenticationFilter.ERROR_ATTR);
        String message = "expired".equals(reason) ? "Your session has expired. Please sign in again."
                : "invalid".equals(reason) ? "Your session is not valid. Please sign in again."
                : "Please sign in to continue.";
        write(response, HttpStatus.UNAUTHORIZED, message, request.getRequestURI());
    }

    void write(HttpServletResponse response, HttpStatus status, String message, String path) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(),
                new ErrorResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(), message, path, null));
    }
}
