package com.technest.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {
    // 72 is bcrypt's input limit.
    private static final Pattern RULE = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,72}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        return value == null || RULE.matcher(value).matches();   // null/blank handled by @NotBlank
    }
}
