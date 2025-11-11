package com.kanban.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.http.HttpMethod;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC Configuration
 * - CORS settings for frontend communication
 * - Static resource handling for file uploads
 * - Custom message converters (if needed)
 * - Interceptors (if needed)
 */
@Slf4j
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.upload.path:uploads/avatars}")
    private String uploadPath;

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:3000",  // React dev server
                        "http://localhost:5173"   // Vite dev server
                )
                .allowedMethods(
                        HttpMethod.GET.name(),
                        HttpMethod.POST.name(),
                        HttpMethod.PUT.name(),
                        HttpMethod.PATCH.name(),
                        HttpMethod.DELETE.name(),
                        HttpMethod.OPTIONS.name()
                )
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600); // 1 hour

        // 업로드된 이미지 파일도 CORS 허용
        registry.addMapping("/uploads/**")
                .allowedOrigins(
                        "http://localhost:3000",
                        "http://localhost:5173"
                )
                .allowedMethods(HttpMethod.GET.name())
                .allowedHeaders("*")
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // 업로드된 아바타 이미지 정적 리소스 제공
        String workingDir = System.getProperty("user.dir");
        String absolutePath = uploadPath.startsWith("/")
            ? uploadPath
            : workingDir + "/" + uploadPath;

        log.info("Static resource mapping configured:");
        log.info("  - Working directory: {}", workingDir);
        log.info("  - Upload path (property): {}", uploadPath);
        log.info("  - Absolute path: {}", absolutePath);
        log.info("  - Resource handler: /uploads/avatars/**");
        log.info("  - Resource location: file:{}/", absolutePath);

        registry
                .addResourceHandler("/uploads/avatars/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }
}
