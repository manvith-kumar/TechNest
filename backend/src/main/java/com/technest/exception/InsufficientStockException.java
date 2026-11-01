package com.technest.exception;

import org.springframework.http.HttpStatus;

public class InsufficientStockException extends ApiException {
    public InsufficientStockException(String message) {
        super(HttpStatus.CONFLICT, message);
    }
}
