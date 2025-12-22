package com.itmo.spy_system.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.DeviceChangeTaskRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import com.itmo.spy_system.service.*;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/device_change_tasks")
@RequiredArgsConstructor
public class DeviceChangeTaskController {
    private final DeviceChangeTaskService service;
    private final NotificationService notificationService;
    private final WorkerService workerService;
    private final ClientService clientService;
    private final DeviceService deviceService;
    private final ManagerRepository managerRepository;
    private final WorkerRepository workerRepository;
    private final DeviceChangeTaskRepository deviceChangeTaskRepository;

    @Secured({"manager", "worker"})
    @GetMapping("/filtered")
    public List<DeviceChangeTask> getFiltered(@RequestParam(required = false) Long clientId, @RequestParam(required = false) Long executionerId, @RequestParam(required = false) Long creatorId) {

        List<DeviceChangeTask> results = service.findAll();
        List<DeviceChangeTask> tasksToRemove = new ArrayList<>();

        if (clientId != null) {
            for (DeviceChangeTask p : results) {
                if (p.getClient() != null && !p.getClient().getId().equals(clientId) && !tasksToRemove.contains(p)) {
                    tasksToRemove.add(p);
                }
            }
        }
//            results.removeIf(e -> !e.getClient().getId().equals(clientId));
        if (executionerId != null) {
            for (DeviceChangeTask p : results) {
                if (p.getExecutionerId() == null || !p.getExecutionerId().equals(executionerId) && !tasksToRemove.contains(p)) {
                    tasksToRemove.add(p);
                }
            }
        }
//            results.removeIf(e -> !e.getExecutionerId().equals(executionerId));
        if (creatorId != null) {
            for (DeviceChangeTask p : results) {
                if (p.getCreatorId() == null || !p.getCreatorId().equals(creatorId) && !tasksToRemove.contains(p)) {
                    tasksToRemove.add(p);
                }
            }
        }
//            results.removeIf(e -> !e.getCreatorId().equals(creatorId));
//        if (triggeredMetricId != null) {
//            for (DeviceChangeTask p : results) {
//                if (p.getTriggeredMetricId() == null || !p.getTriggeredMetricId().equals(clientId) && !tasksToRemove.contains(p)) {
//                    tasksToRemove.add(p);
//                }
//            }
//        }
//            results.removeIf(e -> !e.getTriggeredMetricId().equals(triggeredMetricId));
        for (DeviceChangeTask t : tasksToRemove) {
            results.remove(t);
        }
        return results;
    }

    @Secured({"manager", "worker"})
    @GetMapping
    public List<DeviceChangeTask> getAll() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("manager"));
        boolean isWorker = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("worker"));

        List<Client> clientsToRemove = new ArrayList<>();
        if (isManager) {
            String managerEmail = authentication.getName();
            Manager m = managerRepository.findByEmail(managerEmail).get();
            List<Worker> ws = workerRepository.findByManagerId(m.getId());
            List<Long> wIds = new ArrayList<>();
            for (Worker w : ws) {
                wIds.add(w.getId());
            }
            return deviceChangeTaskRepository.findByExecutionerIdIn(wIds);
        }
        return service.findAll();
    }

    @Secured({"manager", "worker"})
    @GetMapping("/{id}")
    public ResponseEntity<DeviceChangeTask> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceChangeTaskCreate {
        @Enumerated(EnumType.STRING)
        private String cause;
        private Long clientId;
        private Long creatorId;
        private Long oldDeviceId;
        private Long newDeviceId;
    }

    @Secured({"manager", "worker"})
    @PostMapping
    public DeviceChangeTask create(@RequestBody DeviceChangeTaskCreate entity) {
        DeviceChangeTask pt = new DeviceChangeTask();
        pt.setExecutionerId(workerService.findMostFreeCorrectionsOfficer().getId());
        pt.setCreatorId(entity.getCreatorId());
        pt.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        pt.setOldDeviceId(entity.getOldDeviceId());
        pt.setNewDeviceId(entity.getNewDeviceId());
        if (entity.getOldDeviceId() != null) {
            Device d = deviceService.findById(entity.getOldDeviceId()).get();
            d.setAssignmentStatus(DeviceAssignmentStatus.UNASSIGNMENT_PENDING);
            deviceService.save(d);
        }
        if (entity.getNewDeviceId() != null) {
            Device d = deviceService.findById(entity.getNewDeviceId()).get();
            d.setAssignmentStatus(DeviceAssignmentStatus.ASSIGNMENT_PENDING);
            d.setAssignedClientId(entity.getClientId());
            deviceService.save(d);
        }
        Optional<Client> client = clientService.findById(entity.getClientId());
        client.ifPresent(pt::setClient);
//        pt.setCause(entity.getCause());
        return service.create(pt, client.get());
    }

    @Secured({"worker"})
    @PutMapping("/{id}")
    public ResponseEntity<DeviceChangeTask> update(@PathVariable Long id, @RequestBody DeviceChangeTask entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @Secured({"manager"})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @Autowired
    ObjectMapper objectMapper;

    @Secured({"worker", "manager"})
    @PatchMapping("/{id}")
    public ResponseEntity<DeviceChangeTask> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        DeviceChangeTask toBePatched = objectMapper.convertValue(entity, DeviceChangeTask.class);
        toBePatched.setId(id);
        return ResponseEntity.ok(service.patch(toBePatched));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
