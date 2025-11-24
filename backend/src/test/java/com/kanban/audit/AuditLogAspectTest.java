package com.kanban.audit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.data.repository.CrudRepository;

@ExtendWith(MockitoExtension.class)
class AuditLogAspectTest {

    @Mock
    private AuditLogRepository auditLogRepository;
    @Mock
    private AuditContext auditContext;
    @Mock
    private EntityDiffCalculator entityDiffCalculator;
    @Mock
    private ApplicationContext applicationContext;
    @Mock
    private CrudRepository repository;
    @Mock
    private ProceedingJoinPoint joinPoint;
    @Mock
    private MethodSignature signature;

    @InjectMocks
    private AuditLogAspect auditLogAspect;

    @BeforeEach
    void setUp() {
        lenient().when(joinPoint.getSignature()).thenReturn(signature);
        lenient().when(applicationContext.getBean(any(String.class))).thenReturn(repository);
    }

    @Test
    void audit_CreateAction_ShouldSaveLog() throws Throwable {
        // Given
        Auditable auditable = mock(Auditable.class);
        when(auditable.action()).thenReturn(AuditAction.CREATE);
        when(auditable.targetType()).thenReturn(AuditTargetType.CARD);

        Object createdEntity = new Object();
        when(joinPoint.proceed()).thenReturn(createdEntity);
        when(entityDiffCalculator.calculateDiff(isNull(), any()))
                .thenReturn("{\"diff\": \"created\"}");

        // When
        auditLogAspect.audit(joinPoint, auditable);

        // Then
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void audit_UpdateAction_ShouldSaveLog_WhenChangesExist() throws Throwable {
        // Given
        Auditable auditable = mock(Auditable.class);
        when(auditable.action()).thenReturn(AuditAction.UPDATE);
        when(auditable.targetType()).thenReturn(AuditTargetType.CARD);
        when(auditable.targetId()).thenReturn("#id");

        String[] paramNames = {"id"};
        Object[] args = {1L};
        when(signature.getParameterNames()).thenReturn(paramNames);
        when(joinPoint.getArgs()).thenReturn(args);

        when(repository.findById(1L)).thenReturn(Optional.of(new Object()));
        when(entityDiffCalculator.calculateDiff(any(), any()))
                .thenReturn("{\"diff\": \"updated\"}");

        // When
        auditLogAspect.audit(joinPoint, auditable);

        // Then
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void audit_UpdateAction_ShouldNotSaveLog_WhenNoChanges() throws Throwable {
        // Given
        Auditable auditable = mock(Auditable.class);
        when(auditable.action()).thenReturn(AuditAction.UPDATE);
        when(auditable.targetType()).thenReturn(AuditTargetType.CARD);
        when(auditable.targetId()).thenReturn("#id");

        String[] paramNames = {"id"};
        Object[] args = {1L};
        when(signature.getParameterNames()).thenReturn(paramNames);
        when(joinPoint.getArgs()).thenReturn(args);

        when(repository.findById(1L)).thenReturn(Optional.of(new Object()));
        when(entityDiffCalculator.calculateDiff(any(), any())).thenReturn(null);

        // When
        auditLogAspect.audit(joinPoint, auditable);

        // Then
        verify(auditLogRepository, never()).save(any(AuditLog.class));
    }
}
