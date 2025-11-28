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

        String targetId = resolveTargetId(joinPoint, auditable.targetId());
        Object oldState = captureOldState(auditable, targetId);
        Object result = joinPoint.proceed();
        StateCapture newStateCapture = captureNewState(auditable, result, targetId);
        saveAuditLog(auditable, newStateCapture.targetId(), oldState, newStateCapture.state());

        return result;
    }

    private Object captureOldState(Auditable auditable, String targetId) {
        if (auditable.action() != AuditAction.UPDATE && auditable.action() != AuditAction.DELETE) {
            return null;
        }
        Object entity = fetchEntity(auditable.targetType(), targetId);
        if (entity == null) {
            log.warn("AUDIT: oldState entity not found - targetType={}, targetId={}",
                    auditable.targetType(), targetId);
            return null;
        }
        try {
            log.info("AUDIT: Cloning oldState entity - type={}, id={}",
                    entity.getClass().getSimpleName(), targetId);
            String json = objectMapper.writeValueAsString(entity);
            Object cloned = objectMapper.readValue(json, entity.getClass());
            log.info("AUDIT: Successfully cloned oldState");
            return cloned;
        } catch (Exception e) {
            log.error("AUDIT: CRITICAL - Failed to clone entity for audit! type={}, id={}",
                    entity.getClass().getSimpleName(), targetId, e);
            return entity;
        }
    }

    private StateCapture captureNewState(Auditable auditable, Object result, String targetId) {
        if (auditable.action() != AuditAction.CREATE && auditable.action() != AuditAction.UPDATE) {
            return new StateCapture(targetId, null);
        }
        if (auditable.action() == AuditAction.CREATE) {
            String newId = extractId(result);
            String effectiveId = newId != null ? newId : targetId;
            Object fetched = newId != null ? fetchEntity(auditable.targetType(), newId) : null;
            Object state = fetched != null ? fetched : result;
            return new StateCapture(effectiveId, state);
        }
        return new StateCapture(targetId, fetchEntity(auditable.targetType(), targetId));
    }

    private void saveAuditLog(Auditable auditable, String targetId, Object oldState,
            Object newState) {
        try {
            log.info("AUDIT: Calculating diff - oldState={}, newState={}",
                    oldState != null ? oldState.getClass().getSimpleName() : "null",
                    newState != null ? newState.getClass().getSimpleName() : "null");

            String changes = entityDiffCalculator.calculateDiff(oldState, newState);

            log.info("AUDIT: Diff result - changes={}", changes != null ? "PRESENT" : "NULL");

            if (changes != null || auditable.action() == AuditAction.DELETE) {
                AuditLog auditLog = AuditLog.builder().action(auditable.action())
                        .targetType(auditable.targetType()).targetId(targetId)
                        .actorId(auditContext.getCurrentUserId() != null
                                ? auditContext.getCurrentUserId()
                                : 0L)
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
        }
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

    @SuppressWarnings("unchecked")
    private CrudRepository<?, Long> getRepository(AuditTargetType type) {
        return switch (type) {
            case BOARD -> (CrudRepository<?, Long>) applicationContext.getBean("boardRepository");
            case COLUMN -> (CrudRepository<?, Long>) applicationContext.getBean("columnRepository");
            case CARD -> (CrudRepository<?, Long>) applicationContext.getBean("cardRepository");
            case MEMBER -> throw new IllegalArgumentException("MEMBER audit not yet supported");
        };
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

    private record StateCapture(String targetId, Object state) {
    }
}
