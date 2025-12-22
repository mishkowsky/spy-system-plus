package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.DeviceChangeTask;
import com.itmo.spy_system.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DeviceChangeTaskRepository extends JpaRepository<DeviceChangeTask, Long> {
    List<DeviceChangeTask> findByExecutionerIdAndStatusIn(Long executionerId, List<TaskStatus> statuses);
    List<DeviceChangeTask> findByOldDeviceIdOrNewDeviceIdAndStatusIn(Long oldDeviceId, Long newDeviceId, List<TaskStatus> statuses);
    List<DeviceChangeTask> findByExecutionerIdIn(Collection<Long> ids);
}
