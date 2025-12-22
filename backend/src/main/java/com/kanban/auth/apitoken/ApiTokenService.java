package com.kanban.auth.apitoken;

import com.kanban.auth.apitoken.dto.ApiTokenSummaryResponse;
import com.kanban.auth.apitoken.dto.CreateApiTokenRequest;
import com.kanban.auth.apitoken.dto.CreateApiTokenResponse;
import com.kanban.auth.config.ApiTokenProperties;
import com.kanban.board.Board;
import com.kanban.board.BoardRepository;
import com.kanban.board.member.BoardMemberRole;
import com.kanban.board.member.BoardMemberRoleValidator;
import com.kanban.user.User;
import com.kanban.user.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ApiTokenService {

    private static final int TOKEN_BYTES = 32;

    private final ApiTokenRepository apiTokenRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final BoardMemberRoleValidator roleValidator;
    private final ApiTokenHasher apiTokenHasher;
    private final ApiTokenProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public ApiTokenService(ApiTokenRepository apiTokenRepository, BoardRepository boardRepository,
            UserRepository userRepository, BoardMemberRoleValidator roleValidator,
            ApiTokenHasher apiTokenHasher, ApiTokenProperties properties) {
        this.apiTokenRepository = apiTokenRepository;
        this.boardRepository = boardRepository;
        this.userRepository = userRepository;
        this.roleValidator = roleValidator;
        this.apiTokenHasher = apiTokenHasher;
        this.properties = properties;
    }

    public CreateApiTokenResponse createToken(Long userId, CreateApiTokenRequest request) {
        validateCreateRequest(request);

        Board board = boardRepository.findById(request.boardId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "보드를 찾을 수 없습니다"));
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다"));

        roleValidator.validateRole(board.getId(), request.role());

        Set<ApiTokenScope> requestedScopes = EnumSet.copyOf(request.scopes());
        Set<ApiTokenScope> allowedScopes = allowedScopesForRole(request.role());
        if (!allowedScopes.containsAll(requestedScopes)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "역할에 허용되지 않는 스코프가 포함되어 있습니다");
        }

        String tokenValue = generateTokenValue();
        String tokenHash = apiTokenHasher.hash(tokenValue);
        String tokenPrefix = tokenValue.substring(0, Math.min(8, tokenValue.length()));

        ApiToken apiToken = ApiToken.builder()
                .name(request.name())
                .tokenPrefix(tokenPrefix)
                .tokenHash(tokenHash)
                .ownerUser(owner)
                .board(board)
                .role(request.role())
                .expiresAt(request.expiresAt())
                .build();
        apiToken.setScopeSet(requestedScopes);

        ApiToken saved = apiTokenRepository.save(apiToken);

        return new CreateApiTokenResponse(saved.getId(), tokenValue, saved.getTokenPrefix(),
                saved.getRole(), saved.getScopeSet(), saved.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public List<ApiTokenSummaryResponse> listTokens(Long userId) {
        return apiTokenRepository.findByOwnerUserIdOrderByCreatedAtDesc(userId).stream()
                .map(token -> new ApiTokenSummaryResponse(token.getId(), token.getName(),
                        token.getBoard().getId(), token.getTokenPrefix(), token.getRole(),
                        token.getScopeSet(), token.getExpiresAt(), token.getLastUsedAt(),
                        token.getRevokedAt(), token.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public void revokeToken(Long userId, Long tokenId) {
        ApiToken token = apiTokenRepository.findByIdAndOwnerUserId(tokenId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "토큰을 찾을 수 없습니다"));
        if (token.getRevokedAt() == null) {
            token.setRevokedAt(LocalDateTime.now());
        }
    }

    public Optional<ApiTokenPrincipal> authenticate(String tokenValue, LocalDateTime now) {
        String tokenHash = apiTokenHasher.hash(tokenValue);
        return apiTokenRepository.findByTokenHash(tokenHash)
                .filter(token -> token.getRevokedAt() == null)
                .filter(token -> token.getExpiresAt() == null || token.getExpiresAt().isAfter(now))
                .map(token -> {
                    token.setLastUsedAt(now);
                    ApiTokenPrincipal principal = new ApiTokenPrincipal(token.getOwnerUser().getId(),
                            token.getId(), token.getBoard().getId(), token.getRole(),
                            token.getScopeSet());
                    return principal;
                });
    }

    private void validateCreateRequest(CreateApiTokenRequest request) {
        if (request.expiresAt() != null && request.expiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "만료 시각은 현재 이후여야 합니다");
        }
        if (request.scopes() == null || request.scopes().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "스코프는 최소 1개 이상 필요합니다");
        }
    }

    private String generateTokenValue() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        String base = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String prefix = StringUtils.hasText(properties.prefix()) ? properties.prefix() : "";
        return prefix + base;
    }

    private Set<ApiTokenScope> allowedScopesForRole(BoardMemberRole role) {
        Set<ApiTokenScope> scopes = EnumSet.noneOf(ApiTokenScope.class);
        scopes.add(ApiTokenScope.BOARD_READ);
        scopes.add(ApiTokenScope.CARD_READ);

        if (role == BoardMemberRole.EDITOR || role == BoardMemberRole.MANAGER) {
            scopes.add(ApiTokenScope.BOARD_WRITE);
            scopes.add(ApiTokenScope.CARD_WRITE);
            scopes.add(ApiTokenScope.CARD_ARCHIVE);
        }
        if (role == BoardMemberRole.MANAGER) {
            scopes.add(ApiTokenScope.CARD_MANAGE);
        }
        return scopes;
    }
}
