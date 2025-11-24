package com.kanban.audit;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.context.ApplicationContext;
import org.springframework.data.repository.CrudRepository;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLogAspect {

    private final AuditLogRepository auditLogRepository;
    private final AuditContext auditContext;
    private final EntityDiffCalculator entityDiffCalculator;
    private final ApplicationContext applicationContext;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper =
            new com.fasterxml.jackson.databind.ObjectMapper()
                    .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule())
                    .configure(
                            com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS,
                            false)
                    .configure(
                            com.fasterxml.jackson.databind.SerializationFeature.FAIL_ON_EMPTY_BEANS,
                            false)
                    .configure(
                            com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES,
                            false);
    private final ExpressionParser parser = new SpelExpressionParser();

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        log.info("========== AUDIT ASPECT TRIGGERED: action={}, targetType={}, method={}",
                auditable.action(), auditable.targetType(), joinPoint.getSignature().getName());

        Object oldState = null;
        String targetId = resolveTargetId(joinPoint, auditable.targetId());

        // 1. Capture "Before" state for UPDATE/DELETE
        if (auditable.action() == AuditAction.UPDATE || auditable.action() == AuditAction.DELETE) {
            Object entity = fetchEntity(auditable.targetType(), targetId);
            if (entity != null) {
                // Deep clone via JSON to avoid persistence context issues
                try {
                    log.info("AUDIT: Cloning oldState entity - type={}, id={}",
                            entity.getClass().getSimpleName(), targetId);
                    String json = objectMapper.writeValueAsString(entity);
                    oldState = objectMapper.readValue(json, entity.getClass());
                    log.info("AUDIT: Successfully cloned oldState");
                } catch (Exception e) {
                    log.error("AUDIT: CRITICAL - Failed to clone entity for audit! type={}, id={}",
                            entity.getClass().getSimpleName(), targetId, e);
                    oldState = entity;
                }
            } else {
                log.warn("AUDIT: oldState entity not found - targetType={}, targetId={}",
                        auditable.targetType(), targetId);
            }
        }

        // 2. Execute method
        Object result = joinPoint.proceed();

        // 3. Capture "After" state
        Object newState = null;
        if (auditable.action() == AuditAction.CREATE || auditable.action() == AuditAction.UPDATE) {
            // For CREATE, the result is usually the DTO or Entity.
            // If it's a DTO, we might not have the full entity state unless we fetch it again or
            // map it.
            // Ideally, the service returns the Entity or a detailed DTO.
            // Let's assume the service returns an object we can use or we fetch it if needed.
            // For simplicity, if it's CREATE, we try to use the result.
            // If the result is a ResponseDTO, we might need to map it back or just log the DTO.
            // However, for accurate diffs, comparing Entity to Entity is best.
            // If the return type is a Response DTO, we might need to fetch the entity again using
            // the ID from the DTO.

            // For now, let's try to fetch the entity again if we have the ID, to ensure we have the
            // full state.
            // For CREATE, we need to extract the ID from the result.
            if (auditable.action() == AuditAction.CREATE) {
                String newId = extractId(result);
                if (newId != null) {
                    targetId = newId; // Update targetId for CREATE
                    newState = fetchEntity(auditable.targetType(), newId);
                } else {
                    newState = result; // Fallback to result
                }
            } else {
                // For UPDATE, we already have the ID
                newState = fetchEntity(auditable.targetType(), targetId);
            }
        }

        // 4. Calculate Diff & Save Log
        try {
            log.info("AUDIT: Calculating diff - oldState={}, newState={}",
                    oldState != null ? oldState.getClass().getSimpleName() : "null",
                    newState != null ? newState.getClass().getSimpleName() : "null");

            String changes = entityDiffCalculator.calculateDiff(oldState, newState);

            log.info("AUDIT: Diff result - changes={}", changes != null ? "PRESENT" : "NULL");

            // Only save if there are changes or it's a Create/Delete action
            if (changes != null || auditable.action() == AuditAction.DELETE) {
                AuditLog auditLog = AuditLog.builder().action(auditable.action())
                        .targetType(auditable.targetType()).targetId(targetId)
                        .actorId(auditContext.getCurrentUserId() != null
                                ? auditContext.getCurrentUserId()
                                : 0L) // 0L for system/anon
                        .ipAddress(auditContext.getIpAddress())
                        .userAgent(auditContext.getUserAgent()).changes(changes)
                        .createdAt(LocalDateTime.now()).build();

                auditLogRepository.save(auditLog);
                log.info("AUDIT: Log saved successfully - id={}", auditLog.getId());
            } else {
                log.warn("AUDIT: Skipping save - no changes detected");
            }
        } catch (Exception e) {
            log.error("AUDIT: Failed to save audit log - targetType={}, targetId={}, action={}",
                    auditable.targetType(), targetId, auditable.action(), e);
            // Do not fail the transaction because of audit logging failure?
            // Usually audit logs are critical, so maybe we should let it fail or at least alert.
            // For now, just log error to avoid breaking main flow.
        }

        return result;
    }

    private String resolveTargetId(ProceedingJoinPoint joinPoint, String spEl) {
        if (spEl == null || spEl.isEmpty())
            return null;

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        StandardEvaluationContext context = new StandardEvaluationContext();
        String[] paramNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        for (int i = 0; i < args.length; i++) {
            context.setVariable(paramNames[i], args[i]);
        }

        try {
            Object value = parser.parseExpression(spEl).getValue(context);
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            log.warn("Failed to resolve targetId SpEL: {}", spEl);
            return null;
        }
    }

    private Object fetchEntity(AuditTargetType type, String id) {
        if (id == null)
            return null;
        try {
            Long entityId = Long.parseLong(id);
            CrudRepository<?, Long> repository = getRepository(type);
            return repository.findById(entityId).orElse(null);
        } catch (Exception e) {
            log.warn("Failed to fetch entity for audit: {} {}", type, id);
            return null;
        }
    }

    private CrudRepository<?, Long> getRepository(AuditTargetType type) {
        switch (type) {
            case BOARD:
                return (CrudRepository<?, Long>) applicationContext.getBean("boardRepository");
            case COLUMN:
                return (CrudRepository<?, Long>) applicationContext.getBean("columnRepository");
            case CARD:
                return (CrudRepository<?, Long>) applicationContext.getBean("cardRepository");
            default:
                throw new IllegalArgumentException("Unknown target type: " + type);
        }
    }

    private String extractId(Object obj) {
        if (obj == null)
            return null;
        try {
            // Try to find getId() method
            Method getId = obj.getClass().getMethod("getId");
            Object id = getId.invoke(obj);
            return id != null ? id.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}
