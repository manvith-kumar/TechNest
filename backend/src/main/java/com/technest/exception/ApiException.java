package com.technest.exception;

import org.springframework.http.HttpStatus;

/** Base class for expected, user-facing errors. The message is safe to show to API clients. */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
