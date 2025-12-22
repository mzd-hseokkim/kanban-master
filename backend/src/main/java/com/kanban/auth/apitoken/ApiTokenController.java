package com.kanban.auth.apitoken;

import com.kanban.auth.apitoken.dto.ApiTokenSummaryResponse;
import com.kanban.auth.apitoken.dto.CreateApiTokenRequest;
import com.kanban.auth.apitoken.dto.CreateApiTokenResponse;
import com.kanban.common.SecurityUtil;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/api-tokens")
@RequiredArgsConstructor
public class ApiTokenController {

    private final ApiTokenService apiTokenService;

    @PostMapping
    public ResponseEntity<CreateApiTokenResponse> createToken(
            @Valid @RequestBody CreateApiTokenRequest request) {
        rejectApiTokenAccess();
        Long userId = SecurityUtil.getCurrentUserId();
        CreateApiTokenResponse response = apiTokenService.createToken(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ApiTokenSummaryResponse>> listTokens() {
        rejectApiTokenAccess();
        Long userId = SecurityUtil.getCurrentUserId();
        List<ApiTokenSummaryResponse> responses = apiTokenService.listTokens(userId);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{tokenId}")
    public ResponseEntity<Void> revokeToken(@PathVariable Long tokenId) {
        rejectApiTokenAccess();
        Long userId = SecurityUtil.getCurrentUserId();
        apiTokenService.revokeToken(userId, tokenId);
        return ResponseEntity.noContent().build();
    }

    private void rejectApiTokenAccess() {
        if (SecurityUtil.isApiTokenAuthentication()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "API 토큰으로는 토큰 관리 API에 접근할 수 없습니다");
        }
    }
}
