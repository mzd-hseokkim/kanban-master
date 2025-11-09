package com.kanban.user;

import com.kanban.user.dto.UserSearchResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 사용자 관련 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    /**
     * 사용자 검색 (이름 또는 이메일)
     *
     * @param keyword 검색 키워드
     * @return 검색된 사용자 목록
     */
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<User> users = userRepository.searchByNameOrEmail(keyword.trim());
        List<UserSearchResponse> responses = users.stream()
                .map(user -> UserSearchResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }
}
