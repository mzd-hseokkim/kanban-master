package com.kanban.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

/**
 * Internationalization (i18n) configuration for multi-language support.
 *
 * Supports English (en) and Korean (ko) languages through Spring MessageSource.
 * Uses HTTP Accept-Language header for locale detection.
 */
@Configuration
public class I18nConfig {

    /**
     * Configure MessageSource for internationalization.
     *
     * @return configured ResourceBundleMessageSource
     */
    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasename("messages");
        messageSource.setDefaultEncoding("UTF-8");
        messageSource.setUseCodeAsDefaultMessage(true);
        // Cache: 3600 seconds for production, 0 for development
        messageSource.setCacheSeconds(3600);
        return messageSource;
    }

    /**
     * Configure LocaleResolver to detect locale from HTTP Accept-Language header.
     *
     * @return configured AcceptHeaderLocaleResolver
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.ENGLISH);
        resolver.setSupportedLocales(List.of(Locale.ENGLISH, Locale.KOREAN));
        return resolver;
    }
}
