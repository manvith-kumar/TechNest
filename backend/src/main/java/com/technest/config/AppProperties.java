package com.technest.config;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "technest")
public record AppProperties(Jwt jwt, Cors cors, Shipping shipping, Upload upload, Auth auth) {

    public record Jwt(String secret, long accessTokenMinutes, long refreshTokenDays, boolean cookieSecure) {}

    public record Cors(List<String> allowedOrigins) {}

    public record Shipping(BigDecimal freeThreshold, BigDecimal flatFee) {}

    public record Upload(String dir) {}

    public record Auth(String frontendUrl, boolean logResetLinks, int maxFailedLogins, int lockoutMinutes) {}
}
