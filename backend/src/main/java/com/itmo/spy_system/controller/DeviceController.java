package com.itmo.spy_system.controller;

import com.itmo.spy_system.dto.DeviceMapper;
import com.itmo.spy_system.dto.DeviceWithClientDto;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.*;
import com.itmo.spy_system.service.DeviceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.service.NotificationService;
import com.itmo.spy_system.utils.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {
    private final DeviceService service;
    private final DeviceChangeTaskRepository deviceChangeTaskRepository;
    private final NotificationService notificationService;
    private final MetricRepository metricRepository;
    private final ManagerRepository managerRepository;
    private final ContractRepository contractRepository;
    private final DeviceRepository deviceRepository;
    private final Utils utils;
    private final DeviceMapper deviceMapper;

    @Secured({"manager", "worker"})
    @GetMapping("/filtered")
    public List<Device> getFiltered(@RequestParam(required = false) Long assignedClientId) {
        List<Device> results = service.findAll();

        if (assignedClientId != null) results.removeIf(e -> e.getAssignedClientId() != null && !e.getAssignedClientId().equals(assignedClientId));
        return results;
    }

    @Secured({"manager", "worker"})
    @GetMapping
    public List<DeviceWithClientDto> getAll() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("manager"));
        boolean isWorker = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("worker"));
        if (isManager) {
            String managerEmail = authentication.getName();
            Manager m = managerRepository.findByEmail(managerEmail).get();
            List<Contract> res = contractRepository.findBySignerId(m.getId());
            Set<Long> clientIds = new HashSet<>();
            for (Contract c : res) {
                clientIds.add(c.getClient().getId());
            }
            List<Device> r = deviceRepository.findByAssignedClientIdIn(clientIds);
            List<Device> r2 = deviceRepository.findByAssignedClientIdIsNull();
            r.addAll(r2);
            List<DeviceWithClientDto> res1 = new ArrayList<>();
            for (Device d : r) {
                res1.add(deviceMapper.toDto(d));
            }
            return res1;
        }
        List<Device> ds = service.findAll();
        List<DeviceWithClientDto> res = new ArrayList<>();
        for (Device d : ds) {
            res.add(deviceMapper.toDto(d));
        }
        return res;
    }

    @Secured({"manager", "worker"})
    @GetMapping("/{deviceId}")
    public ResponseEntity<DeviceWithClientDto> getById(@PathVariable Long deviceId) {
        Optional<Device> dOpt = service.findById(deviceId);
        return dOpt.map(device -> ResponseEntity.ok(deviceMapper.toDto(device))).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Secured({"manager", "worker"})
    @PostMapping
    public ResponseEntity<Device> create(@RequestBody Device entity) {
        if (entity.getDeviceId() == null)
            return ResponseEntity.unprocessableEntity().build();
        entity.setStatus(DeviceStatus.OFF);
        entity.setAssignmentStatus(DeviceAssignmentStatus.UNASSIGNED);
        return ResponseEntity.ok(service.save(entity));
    }

    @Secured({"manager", "worker"})
    @PutMapping("/{deviceId}")
    public ResponseEntity<Device> update(@PathVariable Long deviceId, @RequestBody Device entity) {
        if (service.findById(deviceId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        entity.setDeviceId(deviceId);
        return ResponseEntity.ok(service.save(entity));
    }

    @Secured({"manager", "worker"})
    @DeleteMapping("/{deviceId}")
    public void delete(@PathVariable Long deviceId) {
        service.deleteById(deviceId);
    }

    @Secured({"manager", "worker"})
    @GetMapping("/{id}/metrics/latest")
    public ResponseEntity<Metric> getLatestMetric(@PathVariable Long id) {
        return ResponseEntity.of(service.getLatestDeviceMetric(id));
    }

    @PostMapping("/{id}/off")
    public ResponseEntity<?> off(@PathVariable Long id) {
        Optional<Device> optDevice = service.findById(id);
        if (optDevice.isEmpty()) {
            return ResponseEntity.unprocessableEntity().body("DeviceId not found in Device table");
        }
        // create Notification to manager through client
        Manager m = utils.getManagerByDeviceId(id);
        if (m != null) {
            Notification n = new Notification();
            n.setManagerId(m.getId());
            n.setType(NotificationType.DEVICE_OFF);
            n.setText(String.format("Устройство #%d выключено", id));
            n.setRelatedEntityId(id);
            n.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            n.setStatus(NotificationStatus.UNREAD);
            notificationService.save(n);
        }
        Device d = optDevice.get();
        d.setStatus(DeviceStatus.OFF);
        service.save(d);
        return ResponseEntity.ok(d);
    }

    @Autowired
    ObjectMapper objectMapper;

    @Secured({"manager", "worker"})
    @PatchMapping("/{id}")
    public ResponseEntity<Device> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Device toBePatched = objectMapper.convertValue(entity, Device.class);
        toBePatched.setDeviceId(id);
        return ResponseEntity.ok(service.patch(entity, toBePatched));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
