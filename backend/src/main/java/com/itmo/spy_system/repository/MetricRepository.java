package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.Metric;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MetricRepository extends JpaRepository<Metric, Long> {

    Optional<Metric> findTopByDeviceIdOrderByTimestampDesc(Long deviceId);
    Optional<Metric> findTopByClientIdOrderByTimestampDesc(Long clientId);

//    @AllArgsConstructor
//    @Getter
//    public class DeviceLatestMetrics {
//        private final Long metricId;
//        private final Long deviceId;
//        private final Timestamp timestamp;
//    }

    public interface DeviceLatestMetrics {
        Long getId();
        Long getDeviceId();
        Timestamp getTimestamp();
    }

    @Query(value = """
        SELECT m.id, m.device_id AS deviceId, m.timestamp
        FROM device_metric m
        JOIN (
            SELECT device_id, MAX(timestamp) AS max_timestamp
            FROM device_metric
            GROUP BY device_id
        ) t
          ON m.device_id = t.device_id
         AND m.timestamp = t.max_timestamp;
    """, nativeQuery = true)
    List<DeviceLatestMetrics> getLatestDevicesMetrics();
}
