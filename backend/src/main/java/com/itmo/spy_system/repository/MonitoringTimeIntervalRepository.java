package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.MonitoringTimeInterval;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MonitoringTimeIntervalRepository extends JpaRepository<MonitoringTimeInterval, Long> {

    List<MonitoringTimeInterval> findByClientId(Long id);
    List<MonitoringTimeInterval> findByWorkerId(Long id);
    List<MonitoringTimeInterval> findByClientIdIn(Collection<Long> ids);
}
