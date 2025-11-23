package com.kanban.excel;

import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.kanban.excel.dto.ImportJobStartResponse;
import com.kanban.excel.dto.ImportJobStatusResponse;
import com.kanban.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BoardExcelController {

    private final BoardExcelService boardExcelService;

    @GetMapping("/workspaces/{workspaceId}/boards/{boardId}/excel/template")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @AuthenticationPrincipal User user) throws IOException {
        byte[] data = boardExcelService.writeTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"board-template.xlsx\"")
                .contentType(MediaType
                        .parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/workspaces/{workspaceId}/boards/{boardId}/excel/export")
    public ResponseEntity<byte[]> exportBoard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @AuthenticationPrincipal User user) throws IOException {
        byte[] data = boardExcelService.exportBoard(workspaceId, boardId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"board-%d-export.xlsx\"".formatted(boardId))
                .contentType(MediaType
                        .parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @PostMapping(value = "/workspaces/{workspaceId}/boards/{boardId}/excel/import",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImportJobStartResponse> importBoard(@PathVariable Long workspaceId,
            @PathVariable Long boardId, @RequestParam("file") MultipartFile file,
            @RequestParam(name = "mode", defaultValue = "merge") String mode,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증 정보가 없습니다");
        }
        ImportJobStartResponse response =
                boardExcelService.startImport(workspaceId, boardId, file, mode,
                        user != null ? user.getId() : null);
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/import/{jobId}/status")
    public ResponseEntity<ImportJobStatusResponse> getStatus(@PathVariable String jobId) {
        return boardExcelService.getStatus(jobId).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
