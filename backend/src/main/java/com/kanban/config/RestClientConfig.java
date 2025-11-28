package com.kanban.config;

import java.time.Duration;
import org.springframework.boot.web.client.RestClientCustomizer;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

/**
 * REST Client Configuration (Spring 6.1+) Modern replacement for RestTemplate Uses Java 11+
 * HttpClient under the hood
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

        return RestClient.builder().requestFactory(requestFactory);
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

    /**
     * RestTemplate for legacy use cases (e.g., downloading OAuth avatars)
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        var requestFactory = new JdkClientHttpRequestFactory();
        requestFactory.setReadTimeout(Duration.ofSeconds(10));

        return builder.requestFactory(() -> requestFactory).build();
    }
}
