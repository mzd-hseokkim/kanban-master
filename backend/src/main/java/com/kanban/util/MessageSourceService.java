package com.kanban.util;

import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

/**
 * Service for retrieving internationalized messages.
 *
 * Provides convenient methods to get messages from MessageSource
 * using the current locale from LocaleContextHolder.
 */
@Service
@RequiredArgsConstructor
public class MessageSourceService {

    private final MessageSource messageSource;

    /**
     * Get internationalized message by code.
     *
     * @param code the message code
     * @param args optional arguments for message interpolation
     * @return the localized message
     * @throws NoSuchMessageException if message code is not found
     */
    public String getMessage(String code, Object... args) {
        return messageSource.getMessage(code, args, LocaleContextHolder.getLocale());
    }

    /**
     * Get internationalized message by code with fallback.
     *
     * @param code the message code
     * @param defaultMsg the default message if code is not found
     * @param args optional arguments for message interpolation
     * @return the localized message or default message
     */
    public String getMessageOrDefault(String code, String defaultMsg, Object... args) {
        try {
            return getMessage(code, args);
        } catch (NoSuchMessageException e) {
            return defaultMsg;
        }
    }
}
