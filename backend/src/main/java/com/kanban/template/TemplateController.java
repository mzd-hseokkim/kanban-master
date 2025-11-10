package com.kanban.template;

import com.kanban.board.dto.BoardResponse;
import com.kanban.template.dto.ApplyTemplateRequest;
import com.kanban.template.dto.BoardTemplateResponse;
import com.kanban.template.dto.CreateTemplateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 템플릿 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
@Slf4j
public class TemplateController {

    private final TemplateService templateService;

    /**
     * 공개 템플릿 목록 조회
     */
    @GetMapping("/public")
    public ResponseEntity<List<BoardTemplateResponse>> getPublicTemplates() {
        log.debug("GET /api/v1/templates/public");
        List<BoardTemplateResponse> templates = templateService.getPublicTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * 카테고리별 공개 템플릿 조회
     */
    @GetMapping("/public/category/{category}")
    public ResponseEntity<List<BoardTemplateResponse>> getPublicTemplatesByCategory(
            @PathVariable String category) {
        log.debug("GET /api/v1/templates/public/category/{}", category);
        List<BoardTemplateResponse> templates = templateService.getPublicTemplatesByCategory(category);
        return ResponseEntity.ok(templates);
    }

    /**
     * 워크스페이스의 템플릿 목록 조회 (공개 + private)
     */
    @GetMapping("/workspaces/{workspaceId}")
    public ResponseEntity<List<BoardTemplateResponse>> getTemplatesByWorkspace(
            @PathVariable Long workspaceId) {
        log.debug("GET /api/v1/templates/workspaces/{}", workspaceId);
        List<BoardTemplateResponse> templates = templateService.getTemplatesByWorkspace(workspaceId);
        return ResponseEntity.ok(templates);
    }

    /**
     * 템플릿 상세 조회
     */
    @GetMapping("/{templateId}")
    public ResponseEntity<BoardTemplateResponse> getTemplate(@PathVariable Long templateId) {
        log.debug("GET /api/v1/templates/{}", templateId);
        BoardTemplateResponse template = templateService.getTemplate(templateId);
        return ResponseEntity.ok(template);
    }

    /**
     * 기존 보드를 템플릿으로 저장
     */
    @PostMapping("/workspaces/{workspaceId}/boards/{boardId}")
    public ResponseEntity<BoardTemplateResponse> saveAsTemplate(
            @PathVariable Long workspaceId,
            @PathVariable Long boardId,
            @Valid @RequestBody CreateTemplateRequest request) {
        log.debug("POST /api/v1/templates/workspaces/{}/boards/{} - request: {}", workspaceId, boardId, request);
        BoardTemplateResponse template = templateService.saveAsTemplate(workspaceId, boardId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(template);
    }

    /**
     * 커스텀 템플릿 생성 (보드 없이 직접 생성)
     */
    @PostMapping("/workspaces/{workspaceId}")
    public ResponseEntity<BoardTemplateResponse> createCustomTemplate(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateTemplateRequest request) {
        log.debug("POST /api/v1/templates/workspaces/{} - request: {}", workspaceId, request);
        BoardTemplateResponse template = templateService.createCustomTemplate(workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(template);
    }

    /**
     * 템플릿 적용 (템플릿으로부터 새 보드 생성)
     */
    @PostMapping("/workspaces/{workspaceId}/apply")
    public ResponseEntity<BoardResponse> applyTemplate(
            @PathVariable Long workspaceId,
            @Valid @RequestBody ApplyTemplateRequest request) {
        log.debug("POST /api/v1/templates/workspaces/{}/apply - request: {}", workspaceId, request);
        BoardResponse board = templateService.applyTemplate(workspaceId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(board);
    }

    /**
     * 템플릿 삭제
     */
    @DeleteMapping("/{templateId}/workspaces/{workspaceId}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable Long templateId,
            @PathVariable Long workspaceId) {
        log.debug("DELETE /api/v1/templates/{}/workspaces/{}", templateId, workspaceId);
        templateService.deleteTemplate(templateId, workspaceId);
        return ResponseEntity.noContent().build();
    }

    /**
     * 모든 카테고리 목록 조회
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        log.debug("GET /api/v1/templates/categories");
        List<String> categories = templateService.getAllCategories();
        return ResponseEntity.ok(categories);
    }
}
