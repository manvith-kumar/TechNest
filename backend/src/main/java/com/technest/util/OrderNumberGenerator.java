package com.technest.util;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class OrderNumberGenerator {
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private OrderNumberGenerator() {}

    /** e.g. TN-20261031-K7M2QX */
    public static String next() {
        StringBuilder sb = new StringBuilder("TN-").append(LocalDate.now().format(DATE)).append('-');
        for (int i = 0; i < 6; i++) sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        return sb.toString();
    }
}
