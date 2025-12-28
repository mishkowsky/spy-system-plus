package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.DeviceRepository;
import com.itmo.spy_system.repository.MetricRepository;
import com.itmo.spy_system.repository.NotificationRepository;
import com.itmo.spy_system.utils.Utils;
import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Configuration
@EnableScheduling
@AllArgsConstructor
public class DeviceHealthCheck {

    private final MetricRepository metricRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final DeviceRepository deviceRepository;
    private final Utils utils;

    @Scheduled(fixedRate = 60_000) // run every minute
    public void checkDeviceHealth() {
        List<MetricRepository.DeviceLatestMetrics> lms = metricRepository.getLatestDevicesMetrics();
        for (MetricRepository.DeviceLatestMetrics lm : lms) {
            long threeMinutesInMillis =  3 * 60 * 1000L;
            Timestamp threeMinutesAgo = new Timestamp(System.currentTimeMillis() - threeMinutesInMillis);
            if (lm.getTimestamp().before(threeMinutesAgo)) {
                // TODO get manager to notify through assigned to this device client
                Manager m = utils.getManagerByDeviceId(lm.getDeviceId());
                Optional<Notification> existingN = notificationRepository.findByRelatedEntityIdAndType(lm.getId(), NotificationType.DEVICE_INACTIVE);
                Device d = deviceRepository.findById(lm.getDeviceId()).get();
                if (m != null && existingN.isEmpty() && d.getStatus() == DeviceStatus.ACTIVE) { // add check that notification already done
                    Notification n = new Notification();
                    n.setManagerId(m.getId());
                    n.setType(NotificationType.DEVICE_INACTIVE);
                    n.setText(String.format("Устройство #%d было неактивно последние 3 минуты", lm.getDeviceId()));
                    n.setRelatedEntityId(lm.getId());
                    n.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    n.setStatus(NotificationStatus.UNREAD);
                    notificationService.save(n);
                }
                d.setStatus(DeviceStatus.INACTIVE);
                deviceRepository.save(d);
            }
        }
    }
}
