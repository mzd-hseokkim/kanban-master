package com.kanban.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI (Swagger) Configuration
 * API Documentation available at: http://localhost:8080/swagger-ui.html
 * OpenAPI JSON available at: http://localhost:8080/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(servers());
    }

    private Info apiInfo() {
        return new Info()
                .title("Kanban Board API")
                .description("REST API for Kanban Board Application")
                .version("1.0.0")
                .contact(new Contact()
                        .name("Kanban Team")
                        .email("team@kanban.com")
                        .url("https://github.com/kanban-board"))
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT"));
    }

    private List<Server> servers() {
        return List.of(
                new Server()
                        .url("http://localhost:8080")
                        .description("Local Development Server"),
                new Server()
                        .url("https://api.kanban.com")
                        .description("Production Server")
        );
    }
}
