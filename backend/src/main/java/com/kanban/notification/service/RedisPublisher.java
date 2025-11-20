package com.kanban.notification.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import com.kanban.notification.event.BoardEvent;
import com.kanban.notification.event.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisPublisher {

    private final RedisTemplate<String, BoardEvent> redisTemplate;
    private final RedisTemplate<String, NotificationEvent> notificationRedisTemplate;
    private static final String TOPIC_BOARD = "board-events";
    private static final String TOPIC_NOTIFICATION = "notification-events";

    public void publish(BoardEvent event) {
        log.debug("Publishing board event to Redis topic {}: {}", TOPIC_BOARD, event);
        redisTemplate.convertAndSend(TOPIC_BOARD, event);
    }

    public void publishNotification(NotificationEvent event) {
        log.debug("Publishing notification event to Redis topic {}: {}", TOPIC_NOTIFICATION, event);
        notificationRedisTemplate.convertAndSend(TOPIC_NOTIFICATION, event);
    }
}
