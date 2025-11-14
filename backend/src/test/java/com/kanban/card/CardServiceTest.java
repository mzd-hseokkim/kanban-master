package com.kanban.card;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.owasp.html.PolicyFactory;

import com.kanban.activity.ActivityService;
import com.kanban.board.member.BoardMemberRoleValidator;
import com.kanban.card.dto.CreateCardRequest;
import com.kanban.card.dto.UpdateCardRequest;
import com.kanban.column.BoardColumn;
import com.kanban.column.ColumnRepository;
import com.kanban.label.CardLabelRepository;
import com.kanban.user.UserRepository;

/**
 * CardService Unit Test
 * HTML Sanitization 로직 검증
 */
@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock
    private CardRepository cardRepository;

    @Mock
    private ColumnRepository columnRepository;

    @Mock
    private ActivityService activityService;

    @Mock
    private BoardMemberRoleValidator roleValidator;

    @Mock
    private CardLabelRepository cardLabelRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PolicyFactory htmlSanitizerPolicy;

    @InjectMocks
    private CardService cardService;

    @Test
    @DisplayName("카드 생성 시 description이 sanitize되어야 함")
    void shouldSanitizeDescriptionOnCreate() {
        // given
        Long columnId = 1L;
        Long userId = 1L;
        String maliciousHtml = "<p>안전한 내용</p><script>alert('XSS')</script>";
        String sanitizedHtml = "<p>안전한 내용</p>";

        BoardColumn column = BoardColumn.builder()
                .id(columnId)
                .name("테스트 칼럼")
                .position(0)
                .build();

        CreateCardRequest request = CreateCardRequest.builder()
                .title("테스트 카드")
                .description(maliciousHtml)
                .build();

        when(columnRepository.findById(columnId)).thenReturn(Optional.of(column));
        when(cardRepository.countByColumnId(columnId)).thenReturn(0);
        when(htmlSanitizerPolicy.sanitize(maliciousHtml)).thenReturn(sanitizedHtml);
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(1L);
            return card;
        });

        // when
        cardService.createCard(columnId, request, userId);

        // then
        verify(htmlSanitizerPolicy).sanitize(maliciousHtml);
        ArgumentCaptor<Card> cardCaptor = ArgumentCaptor.forClass(Card.class);
        verify(cardRepository).save(cardCaptor.capture());

        Card savedCard = cardCaptor.getValue();
        assertThat(savedCard.getDescription()).isEqualTo(sanitizedHtml);
        assertThat(savedCard.getDescription()).doesNotContain("<script>");
    }

    @Test
    @DisplayName("카드 수정 시 description이 sanitize되어야 함")
    void shouldSanitizeDescriptionOnUpdate() {
        // given
        Long columnId = 1L;
        Long cardId = 1L;
        Long userId = 1L;
        String maliciousHtml = "<p>수정된 내용</p><iframe src=\"evil.com\"></iframe>";
        String sanitizedHtml = "<p>수정된 내용</p>";

        BoardColumn column = BoardColumn.builder()
                .id(columnId)
                .name("테스트 칼럼")
                .position(0)
                .build();

        Card existingCard = Card.builder()
                .id(cardId)
                .column(column)
                .title("원본 카드")
                .description("<p>원본 내용</p>")
                .position(0)
                .build();

        UpdateCardRequest request = UpdateCardRequest.builder()
                .description(maliciousHtml)
                .build();

        when(cardRepository.findByIdAndColumnId(cardId, columnId)).thenReturn(Optional.of(existingCard));
        when(htmlSanitizerPolicy.sanitize(maliciousHtml)).thenReturn(sanitizedHtml);
        when(cardRepository.save(any(Card.class))).thenReturn(existingCard);

        // when
        cardService.updateCard(columnId, cardId, request, userId);

        // then
        verify(htmlSanitizerPolicy).sanitize(maliciousHtml);
        assertThat(existingCard.getDescription()).isEqualTo(sanitizedHtml);
        assertThat(existingCard.getDescription()).doesNotContain("<iframe>");
    }

    @Test
    @DisplayName("null이나 빈 description은 sanitize 없이 처리되어야 함")
    void shouldHandleNullAndEmptyDescriptions() {
        // given
        Long columnId = 1L;
        Long userId = 1L;

        BoardColumn column = BoardColumn.builder()
                .id(columnId)
                .name("테스트 칼럼")
                .position(0)
                .build();

        // Case 1: null description
        CreateCardRequest request1 = CreateCardRequest.builder()
                .title("null 설명 테스트")
                .description(null)
                .build();

        when(columnRepository.findById(columnId)).thenReturn(Optional.of(column));
        when(cardRepository.countByColumnId(columnId)).thenReturn(0);
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(1L);
            return card;
        });

        // when
        cardService.createCard(columnId, request1, userId);

        // then
        verify(htmlSanitizerPolicy, never()).sanitize(null);

        // Case 2: empty description
        CreateCardRequest request2 = CreateCardRequest.builder()
                .title("빈 설명 테스트")
                .description("")
                .build();

        when(cardRepository.countByColumnId(columnId)).thenReturn(1);

        // when
        cardService.createCard(columnId, request2, userId);

        // then
        verify(htmlSanitizerPolicy, never()).sanitize("");
    }

    @Test
    @DisplayName("스크립트 태그가 포함된 description은 sanitize되어야 함")
    void shouldRemoveScriptTags() {
        // given
        Long columnId = 1L;
        Long userId = 1L;
        String maliciousHtml = "<script>alert('XSS')</script><p>내용</p>";
        String sanitizedHtml = "<p>내용</p>";

        BoardColumn column = BoardColumn.builder()
                .id(columnId)
                .name("테스트 칼럼")
                .position(0)
                .build();

        CreateCardRequest request = CreateCardRequest.builder()
                .title("스크립트 테스트")
                .description(maliciousHtml)
                .build();

        when(columnRepository.findById(columnId)).thenReturn(Optional.of(column));
        when(cardRepository.countByColumnId(columnId)).thenReturn(0);
        when(htmlSanitizerPolicy.sanitize(maliciousHtml)).thenReturn(sanitizedHtml);
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(1L);
            return card;
        });

        // when
        cardService.createCard(columnId, request, userId);

        // then
        verify(htmlSanitizerPolicy).sanitize(maliciousHtml);
        ArgumentCaptor<Card> cardCaptor = ArgumentCaptor.forClass(Card.class);
        verify(cardRepository).save(cardCaptor.capture());

        Card savedCard = cardCaptor.getValue();
        assertThat(savedCard.getDescription()).isEqualTo(sanitizedHtml);
        assertThat(savedCard.getDescription()).doesNotContain("<script>");
        assertThat(savedCard.getDescription()).doesNotContain("alert");
    }

    @Test
    @DisplayName("이벤트 핸들러가 포함된 description은 sanitize되어야 함")
    void shouldRemoveEventHandlers() {
        // given
        Long columnId = 1L;
        Long userId = 1L;
        String maliciousHtml = "<p onclick=\"alert('XSS')\">클릭하세요</p>";
        String sanitizedHtml = "<p>클릭하세요</p>";

        BoardColumn column = BoardColumn.builder()
                .id(columnId)
                .name("테스트 칼럼")
                .position(0)
                .build();

        CreateCardRequest request = CreateCardRequest.builder()
                .title("이벤트 핸들러 테스트")
                .description(maliciousHtml)
                .build();

        when(columnRepository.findById(columnId)).thenReturn(Optional.of(column));
        when(cardRepository.countByColumnId(columnId)).thenReturn(0);
        when(htmlSanitizerPolicy.sanitize(maliciousHtml)).thenReturn(sanitizedHtml);
        when(cardRepository.save(any(Card.class))).thenAnswer(invocation -> {
            Card card = invocation.getArgument(0);
            card.setId(1L);
            return card;
        });

        // when
        cardService.createCard(columnId, request, userId);

        // then
        verify(htmlSanitizerPolicy).sanitize(maliciousHtml);
        ArgumentCaptor<Card> cardCaptor = ArgumentCaptor.forClass(Card.class);
        verify(cardRepository).save(cardCaptor.capture());

        Card savedCard = cardCaptor.getValue();
        assertThat(savedCard.getDescription()).isEqualTo(sanitizedHtml);
        assertThat(savedCard.getDescription()).doesNotContain("onclick");
        assertThat(savedCard.getDescription()).doesNotContain("alert");
    }
}
