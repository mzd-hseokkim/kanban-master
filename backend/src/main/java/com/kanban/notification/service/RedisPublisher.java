package com.kanban.notification.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import com.kanban.notification.event.BoardEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisPublisher {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String TOPIC_BOARD = "board-events";

    public void publish(BoardEvent event) {
        log.debug("Publishing board event to Redis topic {}: {}", TOPIC_BOARD, event);
        redisTemplate.convertAndSend(TOPIC_BOARD, event);
    }
}
