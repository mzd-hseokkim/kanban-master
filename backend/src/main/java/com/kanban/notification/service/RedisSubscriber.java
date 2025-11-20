package com.kanban.notification.service;

import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanban.notification.event.BoardEvent;
import com.kanban.notification.event.NotificationEvent;
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
            String channel = new String(message.getChannel());

            if (channel.endsWith("board-events")) {
                BoardEvent event = objectMapper.readValue(body, BoardEvent.class);
                log.debug("Received board event from Redis: {}", event);
                String destination = "/topic/board/" + event.getBoardId();
                messagingTemplate.convertAndSend(destination, event);
            } else if (channel.endsWith("notification-events")) {
                NotificationEvent event = objectMapper.readValue(body, NotificationEvent.class);
                log.debug("Received notification event from Redis: {}", event);
                // Send to specific user
                messagingTemplate.convertAndSendToUser(String.valueOf(event.getRecipientId()),
                        "/queue/notifications", event);
            }

        } catch (Exception e) {
            log.error("Error processing Redis message", e);
        }
    }
}
