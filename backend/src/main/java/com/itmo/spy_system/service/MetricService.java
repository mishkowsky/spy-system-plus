package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.*;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.DeviceRepository;
import com.itmo.spy_system.repository.MetricRepository;
import com.itmo.spy_system.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.weaver.ast.Not;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricService {

    private final MetricRepository metricRepository;
    private final ClientRepository clientRepository;
    private final DeviceRepository deviceRepository;
    private final NotificationRepository notificationRepository;
    private final PunishmentTaskService punishmentTaskService;
    private final WorkerService workerService;

    public Metric create(Metric metric) {

        Metric previousMetricForClient = metricRepository.findTopByClientIdOrderByTimestampDesc(metric.getClientId()).orElse(null);
        Device device = deviceRepository.findById(metric.getDeviceId()).get();
        Metric saved = metricRepository.save(metric);
//        log.info("Metric created: {}", metric);
        Client client = null;
        if (metric.getClientId() != null)
            client = clientRepository.findById(metric.getClientId()).orElse(null);

        if (client != null && (device.getAssignmentStatus() == DeviceAssignmentStatus.ASSIGNED || device.getAssignmentStatus() == DeviceAssignmentStatus.UNASSIGNMENT_PENDING) &&
                client.getMetricThreshold() != null && saved.getValue() > client.getMetricThreshold() &&
                (previousMetricForClient == null || previousMetricForClient.getValue() < client.getMetricThreshold())) {
//            log.info("Metric fired");
            PunishmentTask task = new PunishmentTask();
//                        task.setClientId(client.getId());
            task.setClient(client);
            task.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            task.setStatus(TaskStatus.NEW);
            PunishmentType punishmentType = client.getViolationsCount() > 4 ? PunishmentType.PHYSICAL : PunishmentType.ELECTRICAL;
            task.setType(punishmentType);
            Long executionerId = workerService.findMostFreeCorrectionsOfficer().getId();
            task.setExecutionerId(executionerId); // Default executioner for example
            task.setTriggeredMetricId(saved.getId());
            PunishmentTask pt = punishmentTaskService.create(task, client);
//            log.info("Punishment task created: {}", pt);

//            client.setViolationsCount(client.getViolationsCount() + 1);
            clientRepository.save(client);
        }

//        deviceRepository.findById(metric.getDeviceId()).ifPresent(device -> {
//            if (device.getAssignedClientId() != null) {
//                clientRepository.findById(device.getAssignedClientId()).ifPresent(client -> {
//                    var devices = deviceRepository.findByAssignedClientId(client.getId());
//                    boolean isFired = true;
//                    for (Device d : devices) {
//                        Metric latestMetric = metricRepository.findTopByDeviceIdOrderByTimestampDesc(d.getDeviceId()).orElse(null);
//                        if (latestMetric != null && latestMetric.getValue() < client.getMetricThreshold() && !Objects.equals(latestMetric.getDeviceId(), saved.getDeviceId())) {
//                            isFired = false;
//                            break;
//                        }
//                    }
//                    if (previousMetric != null && previousMetric.getValue() > client.getMetricThreshold()) {
//                        isFired = false;
//                    }
//                    log.info("Metric fired: {}", isFired);
//                    if (isFired) {
////                        Client client = clientRepository.findById(client.getId()).get();
//                        PunishmentTask task = new PunishmentTask();
////                        task.setClientId(client.getId());
//                        task.setClient(client);
//                        task.setCreatedAt(new Timestamp(System.currentTimeMillis()));
//                        task.setStatus(TaskStatus.NEW);
//                        PunishmentType punishmentType = client.getViolationsCount() > 4 ? PunishmentType.PHYSICAL : PunishmentType.ELECTRICAL;
//                        task.setType(punishmentType);
//                        Long executionerId = workerService.findMostFreeCorrectionsOfficer().getId();
//                        task.setExecutionerId(executionerId); // Default executioner for example
//                        task.setTriggeredMetricId(saved.getId());
//                        PunishmentTask pt = punishmentTaskService.create(task, client);
//                        log.info("Punishment task created: {}", pt);
//
//                        client.setViolationsCount(client.getViolationsCount() + 1);
//                        clientRepository.save(client);
//                    }
//                });
//            }
//        });
        return saved;
    }

    public List<Metric> findAll() {
        return metricRepository.findAll();
    }

    public Optional<Metric> findById(Long id) {
        return metricRepository.findById(id);
    }

//    public Metric patch(Metric toBePatched) {
//        Metric fromDb = metricRepository.findById(toBePatched.getId()).get();
//        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
//        return metricRepository.save(fromDb);
//    }

//    public Metric save(Metric entity) {
//        return metricRepository.save(entity);
//    }

    public void deleteById(Long id) {
        metricRepository.deleteById(id);
    }
}
