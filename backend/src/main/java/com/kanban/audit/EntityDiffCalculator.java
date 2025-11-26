package com.kanban.audit;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class EntityDiffCalculator {

    private final ObjectMapper objectMapper;

    public EntityDiffCalculator() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    public String calculateDiff(Object oldState, Object newState) {
        if (oldState == null && newState == null)
            return null;

        Map<String, Map<String, Object>> diff = new HashMap<>();

        if (oldState == null) {
            // Created: Log all fields as new values
            extractFields(newState, diff, "to");
        } else if (newState == null) {
            // Deleted: Log all fields as old values
            extractFields(oldState, diff, "from");
        } else {
            // Updated: Compare fields
            compareFields(oldState, newState, diff);
        }

        if (diff.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(diff);
        } catch (Exception e) {
            log.error("Failed to serialize diff", e);
            return null;
        }
    }

    @SuppressWarnings("java:S3011")
    private void extractFields(Object obj, Map<String, Map<String, Object>> diff, String key) {
        Class<?> clazz = obj.getClass();
        while (clazz != null) {
            for (Field field : clazz.getDeclaredFields()) {
                field.setAccessible(true);
                try {
                    Object value = field.get(obj);
                    if (shouldIncludeField(field)) {
                        diff.computeIfAbsent(field.getName(), k -> new HashMap<>()).put(key,
                                formatValue(value));
                    }
                } catch (IllegalAccessException e) {
                    log.warn("Failed to access field: {}", field.getName());
                }
            }
            clazz = clazz.getSuperclass();
        }
    }

    @SuppressWarnings("java:S3011")
    private void compareFields(Object oldObj, Object newObj,
            Map<String, Map<String, Object>> diff) {
        Class<?> clazz = oldObj.getClass();
        while (clazz != null) {
            for (Field field : clazz.getDeclaredFields()) {
                field.setAccessible(true);
                try {
                    Object oldValue = field.get(oldObj);
                    Object newValue = field.get(newObj);

                    if (shouldIncludeField(field) && !Objects.equals(oldValue, newValue)) {
                        Map<String, Object> change = new HashMap<>();
                        change.put("from", formatValue(oldValue));
                        change.put("to", formatValue(newValue));
                        diff.put(field.getName(), change);
                    }
                } catch (IllegalAccessException e) {
                    log.warn("Failed to compare field: {}", field.getName());
                }
            }
            clazz = clazz.getSuperclass();
        }
    }

    private boolean shouldIncludeField(Field field) {
        // Exclude static, transient, or specific fields like 'password'
        return !java.lang.reflect.Modifier.isStatic(field.getModifiers())
                && !java.lang.reflect.Modifier.isTransient(field.getModifiers())
                && !field.getName().equals("password"); // Example exclusion
    }

    private Object formatValue(Object value) {
        if (value == null)
            return null;
        // Handle specific types if needed, e.g., entities to IDs
        // For simplicity, we rely on toString() or basic types for now
        // If it's a complex object (Entity), maybe just log ID?
        // Let's keep it simple: if it has getId(), use it.
        try {
            if (value.getClass().getMethod("getId") != null) {
                return value.getClass().getMethod("getId").invoke(value);
            }
        } catch (Exception e) {
            // ignore
        }
        return value.toString();
    }
}
