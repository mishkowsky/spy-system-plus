package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.TimeInterval;
import com.itmo.spy_system.entity.Weekday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TimeIntervalRepository extends JpaRepository<TimeInterval, Long> {
    List<TimeInterval> findByWorkerId(Long workerId);
    List<TimeInterval> findByWorkerIdAndWeekday(Long workerId, Weekday weekday);
    List<TimeInterval> findByManagerIdAndWeekday(Long managerId, Weekday weekday);
}
