package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.DeviceChangeTaskRepository;
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
public class DeviceChangeTaskService {

    private final DeviceChangeTaskRepository repository;
    private final NotificationService notificationService;
    private final DeviceService deviceService;

    public List<DeviceChangeTask> findAll() {
        return repository.findAll();
    }

    public DeviceChangeTask create(DeviceChangeTask entity, Client client) {
        entity.setCreatedAt(new Timestamp(System.currentTimeMillis()));
//        DeviceChangeType punishmentType = client.getViolationsCount() > 4 ? DeviceChangeType.PHYSICAL : DeviceChangeType.ELECTRICAL;
//        entity.setType(punishmentType);
        entity.setStatus(TaskStatus.NEW);

//        client.setViolationsCount(client.getViolationsCount() + 1);
//        clientRepository.save(client);

        // Notification(Long id, String text, NotificationStatus status, Long clientId, Long workerId, Long managerId)
        DeviceChangeTask savedEntity = repository.save(entity);
        Notification notification = new Notification();
        notification.setWorkerId(savedEntity.getExecutionerId());
        notification.setClientId(savedEntity.getClient().getId());
        notification.setStatus(NotificationStatus.UNREAD);
        notification.setType(NotificationType.DEVICE_CHANGE_TASK_CREATION);
        notification.setRelatedEntityId(savedEntity.getId());
        notification.setText("Вам назначено новое задание #" + savedEntity.getId());
        Notification n = notificationService.create(notification);
        return savedEntity;
    }

    public DeviceChangeTask save(DeviceChangeTask entity) {
        return repository.save(entity);
    }

    public Optional<DeviceChangeTask> findById(Long id) {
        return repository.findById(id);
    }

    public DeviceChangeTask patch(DeviceChangeTask toBePatched) {
        DeviceChangeTask fromDb = repository.findById(toBePatched.getId()).get();
        if (toBePatched.getStatus() == TaskStatus.DONE) {
            toBePatched.setDoneAt(new Timestamp(System.currentTimeMillis()));

            Device newDevice = deviceService.findById(fromDb.getNewDeviceId()).get();
            newDevice.setAssignmentStatus(DeviceAssignmentStatus.ASSIGNED);
            deviceService.save(newDevice);

            Device oldDevice = deviceService.findById(fromDb.getOldDeviceId()).get();
            oldDevice.setAssignmentStatus(DeviceAssignmentStatus.UNASSIGNED);
            oldDevice.setAssignedClientId(null);
            deviceService.save(oldDevice);
        }
        if (toBePatched.getStatus() == TaskStatus.CANCELLED) {
            Device newDevice = deviceService.findById(fromDb.getNewDeviceId()).get();
            newDevice.setAssignmentStatus(DeviceAssignmentStatus.UNASSIGNED);
            newDevice.setAssignedClientId(null);
            deviceService.save(newDevice);

            Device oldDevice = deviceService.findById(fromDb.getOldDeviceId()).get();
            oldDevice.setAssignmentStatus(DeviceAssignmentStatus.ASSIGNED);
            deviceService.save(oldDevice);

            Notification notification = new Notification();
            notification.setWorkerId(fromDb.getExecutionerId());
//            notification.setClientId(savedEntity.getClient().getId());
            notification.setStatus(NotificationStatus.UNREAD);
            notification.setType(NotificationType.TASK_CANCELLED);
            notification.setRelatedEntityId(fromDb.getId());
            notification.setText("Задание замены устройства #" + fromDb.getId() + " было отменено");
            Notification n = notificationService.create(notification);
        }
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return repository.save(fromDb);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
