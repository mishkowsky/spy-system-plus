package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.NotificationRepository;
import com.itmo.spy_system.service.DeviceService;
import com.itmo.spy_system.service.MetricService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.service.NotificationService;
import com.itmo.spy_system.utils.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.*;

@RestController
@RequestMapping("/api/metrics")
@RequiredArgsConstructor
public class MetricController {
    private final MetricService service;
    private final DeviceService deviceService;
    private final NotificationService notificationService;
    private final Utils utils;

    @GetMapping("/filtered")
    public List<Metric> getFiltered(@RequestParam(required = false) Long deviceId, @RequestParam(required = false) Long clientId, @RequestParam(required = false) Integer limit) {
        List<Metric> metricsToRemove = new ArrayList<>();

        List<Metric> results = service.findAll();
        if (deviceId != null) {
//            results.removeIf(e -> !e.getDeviceId().equals(deviceId));
            for (Metric m : results) {
                if (!m.getDeviceId().equals(deviceId) && !metricsToRemove.contains(m)) {
                    metricsToRemove.add(m);
                }
            }
        }
        List<Metric> nextFilteredResults = new ArrayList<>();

        if (clientId != null) {
//            List<Metric> metrics_for_client =
//            List<Device> devices = deviceService.findByClientId(clientId);
//            Set<Long> devicesIds = new HashSet<>();
//            for (Device d : devices) {
//                devicesIds.add(d.getDeviceId());
//            }

            for (Metric m : results) {
                if (!Objects.equals(m.getClientId(), clientId) && !metricsToRemove.contains(m)) {
                    metricsToRemove.add(m);
                }
            }
        }

        for (Metric m : metricsToRemove) {
            results.remove(m);
        }

        results.sort((Metric m, Metric m1) -> m1.getTimestamp().compareTo(m.getTimestamp()));

        if (limit != null) {
            results = results.subList(0, limit);
        }

        return results;
    }

    @GetMapping
    public List<Metric> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Metric> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestParam Integer chargeLevel, @RequestBody Metric entity) {
        Optional<Device> optDevice = deviceService.findById(entity.getDeviceId());

        if (optDevice.isEmpty()) {
            return ResponseEntity.unprocessableEntity().body("DeviceId not found in Device table");
        }
        Device d = optDevice.get();
        int previousDeviceBatteryLevel = d.getBatteryLevel();
        d.setBatteryLevel(chargeLevel);
        d.setStatus(DeviceStatus.ACTIVE);

        if (chargeLevel < 15 && previousDeviceBatteryLevel >= 15) {
            Manager m = utils.getManagerByDeviceId(entity.getDeviceId());
            if (m != null) {

                Notification n = new Notification();
                n.setManagerId(m.getId());
                n.setType(NotificationType.DEVICE_LOW_BATTERY);
                n.setText(String.format("Батарея устройства #%d менее 15%%", entity.getDeviceId()));
//        n.setRelatedEntityId(-1);
                n.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                n.setStatus(NotificationStatus.UNREAD);
                notificationService.save(n);
            }
        }
        // Device d = new Device(entity.getDeviceId(), chargeLevel, null, DeviceAssignmentStatus.UNASSIGNED, null, null);
        // deviceService.patch(Map.of("chargeLevel", chargeLevel), d);
        deviceService.save(d);
        entity.setClientId(d.getAssignedClientId());
        return ResponseEntity.ok(service.create(entity));
    }

//    @PutMapping("/{id}")
//    public ResponseEntity<Metric> update(@PathVariable Long id, @RequestBody Metric entity) {
//        if (service.findById(id).isEmpty()) {
//            return ResponseEntity.notFound().build();
//        }
//        entity.setId(id);
//        return ResponseEntity.ok(service.save(entity));
//    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @Autowired
    ObjectMapper objectMapper;

//    @PatchMapping("/{id}")
//    public ResponseEntity<Metric> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
//        if (service.findById(id).isEmpty()) {
//            return ResponseEntity.notFound().build();
//        }
//        Metric toBePatched = objectMapper.convertValue(entity, Metric.class);
//        toBePatched.setId(id);
//        return ResponseEntity.ok(service.patch(toBePatched));
//    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
