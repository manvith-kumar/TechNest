package com.technest;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TechNestApplication {

    public static void main(String[] args) {
        // All timestamps are stored and served as UTC; the frontend converts to the viewer's locale.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(TechNestApplication.class, args);
    }
}
