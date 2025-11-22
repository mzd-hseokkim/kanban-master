package com.kanban.notification.service;

import org.springframework.stereotype.Service;
import com.kanban.common.SecurityUtil;
import com.kanban.notification.NotificationPreference;
import com.kanban.notification.NotificationPreferenceRepository;
import com.kanban.notification.dto.NotificationPreferenceRequest;
import com.kanban.notification.dto.NotificationPreferenceResponse;
import com.kanban.user.User;
import com.kanban.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public NotificationPreferenceResponse getMyPreference() {
        Long userId = SecurityUtil.getCurrentUserId();
        NotificationPreference preference =
                preferenceRepository.findByUserId(userId).orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));

                    return preferenceRepository.save(NotificationPreference.builder().user(user)
                            .notifyDueDate(true).dueDateBeforeMinutes(60).build());
                });

        return NotificationPreferenceResponse.from(preference);
    }

    public NotificationPreferenceResponse updateMyPreference(
            NotificationPreferenceRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        NotificationPreference preference =
                preferenceRepository.findByUserId(userId).orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));

                    return NotificationPreference.builder().user(user).build();
                });

        preference.setNotifyDueDate(request.isNotifyDueDate());
        preference.setDueDateBeforeMinutes(request.getDueDateBeforeMinutes());

        NotificationPreference saved = preferenceRepository.save(preference);
        return NotificationPreferenceResponse.from(saved);
    }
}
