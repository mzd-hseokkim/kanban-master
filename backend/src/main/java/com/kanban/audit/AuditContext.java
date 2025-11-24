package com.kanban.audit;

import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.kanban.common.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class AuditContext {

    public Long getCurrentUserId() {
        try {
            return SecurityUtil.getCurrentUserId();
        } catch (Exception e) {
            return null; // System action or unauthenticated
        }
    }

    public String getIpAddress() {
        return getRequest().map(HttpServletRequest::getRemoteAddr).orElse(null);
    }

    public String getUserAgent() {
        return getRequest().map(req -> req.getHeader("User-Agent")).orElse(null);
    }

    private Optional<HttpServletRequest> getRequest() {
        return Optional.ofNullable(RequestContextHolder.getRequestAttributes())
                .filter(ServletRequestAttributes.class::isInstance)
                .map(ServletRequestAttributes.class::cast)
                .map(ServletRequestAttributes::getRequest);
    }
}
