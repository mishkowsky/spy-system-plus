package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.Notification;
import com.itmo.spy_system.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Optional<Notification> findByRelatedEntityIdAndType(Long relatedEntityId, NotificationType type);
}
