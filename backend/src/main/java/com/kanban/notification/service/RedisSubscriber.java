package com.kanban.notification.service;

import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanban.notification.event.BoardEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisSubscriber implements MessageListener {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void onMessage(org.springframework.data.redis.connection.Message message,
            byte[] pattern) {
        try {
            String body = new String(message.getBody());
            BoardEvent event = objectMapper.readValue(body, BoardEvent.class);

            log.debug("Received message from Redis: {}", event);

            // Forward to WebSocket subscribers
            // Topic structure: /topic/board/{boardId}
            String destination = "/topic/board/" + event.getBoardId();
            messagingTemplate.convertAndSend(destination, event);

        } catch (Exception e) {
            log.error("Error processing Redis message", e);
        }
    }
}
