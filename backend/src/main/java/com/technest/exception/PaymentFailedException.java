package com.technest.exception;

import org.springframework.http.HttpStatus;

public class PaymentFailedException extends ApiException {
    public PaymentFailedException(String message) {
        super(HttpStatus.PAYMENT_REQUIRED, message);
    }
}
