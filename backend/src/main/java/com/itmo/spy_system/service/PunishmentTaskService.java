package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.PunishmentTaskRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class PunishmentTaskService {

    private final PunishmentTaskRepository repository;
    private final NotificationService notificationService;
    private final ClientRepository clientRepository;

    public List<PunishmentTask> findAll() {
        return repository.findAll();
    }

    public PunishmentTask create(PunishmentTask entity, Client client) {
        entity.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        PunishmentType punishmentType = client.getViolationsCount() > 4 ? PunishmentType.PHYSICAL : PunishmentType.ELECTRICAL;
        entity.setType(punishmentType);
        entity.setStatus(TaskStatus.NEW);

        client.setViolationsCount(client.getViolationsCount() + 1);
        clientRepository.save(client);

        // Notification(Long id, String text, NotificationStatus status, Long clientId, Long workerId, Long managerId)
        PunishmentTask savedEntity = repository.save(entity);
        Notification notification = new Notification();
        notification.setWorkerId(savedEntity.getExecutionerId());
//        notification.setClientId(savedEntity.getClient().getId());
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setType(NotificationType.PUNISHMENT_TASK_CREATION);
        notification.setRelatedEntityId(savedEntity.getId());
        notification.setText("Вам было назначено новое задание #" + savedEntity.getId());
        Notification n = notificationService.create(notification);
        return savedEntity;
    }

    public PunishmentTask save(PunishmentTask entity) {
        return repository.save(entity);
    }

    public Optional<PunishmentTask> findById(Long id) {
        return repository.findById(id);
    }

    public PunishmentTask patch(PunishmentTask toBePatched) {
        PunishmentTask fromDb = repository.findById(toBePatched.getId()).get();
        if (toBePatched.getStatus() == TaskStatus.DONE) {
            toBePatched.setDoneAt(new Timestamp(System.currentTimeMillis()));
        }
        if (toBePatched.getStatus() == TaskStatus.CANCELLED) {
            Notification notification = new Notification();
            notification.setWorkerId(fromDb.getExecutionerId());
//            notification.setClientId(savedEntity.getClient().getId());
            notification.setStatus(NotificationStatus.UNREAD);
            notification.setType(NotificationType.TASK_CANCELLED);
            notification.setRelatedEntityId(fromDb.getId());
            notification.setText("Задание наказания #" + fromDb.getId() + " было отменено");
            Notification n = notificationService.create(notification);
        }
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return repository.save(fromDb);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
