package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.Metric;
import com.itmo.spy_system.entity.Notification;
import com.itmo.spy_system.entity.NotificationStatus;
import com.itmo.spy_system.entity.NotificationType;
import com.itmo.spy_system.repository.NotificationRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import lombok.RequiredArgsConstructor;
import org.aspectj.weaver.ast.Not;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;

    public List<Notification> findAll() {
        return repository.findAll();
    }

    public Optional<Notification> findById(Long id) {
        return repository.findById(id);
    }

    public Optional<Notification> findByTypeAndRelatedEntityId(NotificationType type, Long relatedEntityId) {
        return repository.findByRelatedEntityIdAndType(relatedEntityId, type);
    }

    public Notification initNotificationWithDefaultValues() {
        Notification n = new Notification();
        n.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        n.setStatus(NotificationStatus.UNREAD);
        return n;
    }

    public Notification create(Notification entity) {
        entity.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        return repository.save(entity);
    }

    public Notification save(Notification entity) {
        if (entity.getStatus() == null) {
            entity.setStatus(NotificationStatus.UNREAD);
        }
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        }
        return repository.save(entity);
    }

    public Notification patch(Notification toBePatched) {
        Notification fromDb = repository.findById(toBePatched.getId()).get();
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return repository.save(fromDb);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
