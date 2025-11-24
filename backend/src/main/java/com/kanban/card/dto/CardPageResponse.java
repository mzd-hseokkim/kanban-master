package com.kanban.card.dto;

import java.util.List;
import org.springframework.data.domain.Page;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CardPageResponse {
    private List<CardResponse> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    public static CardPageResponse from(Page<CardResponse> page) {
        return CardPageResponse.builder().content(page.getContent()).page(page.getNumber())
                .size(page.getSize()).totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages()).last(page.isLast()).build();
    }
}
