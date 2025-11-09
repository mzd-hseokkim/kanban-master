package com.kanban.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = Map.of(
                "status", "UP",
                "message", "Kanban Backend is running!",
                "timestamp", LocalDateTime.now(),
                "service", "kanban-backend",
                "version", "0.0.1"
        );

        return ResponseEntity.ok(response);
    }
}
