package com.kanban.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Jackson JSON Configuration
 * - Date/Time formatting (ISO-8601)
 * - Pretty printing for development
 * - Java 8+ Time API support
 */
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        var objectMapper = builder.createXmlMapper(false).build();

        // Register Java 8 Time Module
        objectMapper.registerModule(new JavaTimeModule());

        // Write dates as ISO-8601 strings (not timestamps)
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Pretty print for development (disable in production)
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        return objectMapper;
    }
}
