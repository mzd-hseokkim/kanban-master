package com.kanban.notification;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.kanban.user.User;

@Repository
public interface NotificationPreferenceRepository
        extends JpaRepository<NotificationPreference, Long> {
    Optional<NotificationPreference> findByUser(User user);

    Optional<NotificationPreference> findByUserId(Long userId);
}
