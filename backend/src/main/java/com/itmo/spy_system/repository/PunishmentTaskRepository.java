package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.PunishmentTask;
import com.itmo.spy_system.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PunishmentTaskRepository extends JpaRepository<PunishmentTask, Long> {
    List<PunishmentTask> findByExecutionerIdAndStatusIn(Long executionerId, List<TaskStatus> statuses);
    List<PunishmentTask> findByExecutionerIdIn(Collection<Long> ids);
}
