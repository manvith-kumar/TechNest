package com.technest.config;

import java.nio.file.Path;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Serves admin-uploaded product images from the local upload directory. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties props;

    public WebConfig(AppProperties props) {
        this.props = props;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(props.upload().dir()).toAbsolutePath().normalize().toUri().toString();
        if (!location.endsWith("/")) location = location + "/";
        registry.addResourceHandler("/uploads/**").addResourceLocations(location).setCachePeriod(3600);
    }
}
