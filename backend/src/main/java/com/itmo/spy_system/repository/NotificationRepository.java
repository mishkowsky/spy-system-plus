package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.Notification;
import com.itmo.spy_system.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Optional<Notification> findByRelatedEntityIdAndType(Long relatedEntityId, NotificationType type);
    List<Notification> findByClientIdOrderByCreatedAtDesc(Long clientId);
    List<Notification> findByManagerIdOrderByCreatedAtDesc(Long managerId);
    List<Notification> findByWorkerIdOrderByCreatedAtDesc(Long workerId);
}
