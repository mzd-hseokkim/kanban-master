package com.kanban.config;

import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * REST Client Configuration (Spring 6.1+)
 * Modern replacement for RestTemplate
 * Uses Java 11+ HttpClient under the hood
 */
@Configuration
public class RestClientConfig {

    /**
     * Default RestClient.Builder with common settings
     */
    @Bean
    public RestClient.Builder restClientBuilder() {
        var requestFactory = new JdkClientHttpRequestFactory();
        requestFactory.setReadTimeout(Duration.ofSeconds(30));

        return RestClient.builder()
                .requestFactory(requestFactory);
    }

    /**
     * Customizer for all RestClient instances
     */
    @Bean
    public RestClientCustomizer restClientCustomizer() {
        return restClientBuilder -> restClientBuilder
                .defaultHeader("User-Agent", "Kanban-Backend/1.0")
                .defaultHeader("Accept", "application/json");
    }
}
