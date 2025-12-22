package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.PunishmentTaskRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import com.itmo.spy_system.service.ClientService;
import com.itmo.spy_system.service.NotificationService;
import com.itmo.spy_system.service.PunishmentTaskService;
import com.itmo.spy_system.service.WorkerService;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;

import java.sql.Timestamp;
import java.util.*;

@RestController
@RequestMapping("/api/punishment_tasks")
@RequiredArgsConstructor
public class PunishmentTaskController {
    private final PunishmentTaskService service;
    private final NotificationService notificationService;
    private final WorkerService workerService;
    private final ClientService clientService;
    private final ManagerRepository managerRepository;
    private final WorkerRepository workerRepository;
    private final PunishmentTaskRepository punishmentTaskRepository;

    @Secured({"manager", "worker"})
    @GetMapping("/filtered")
    public List<PunishmentTask> getFiltered(@RequestParam(required = false) Long clientId, @RequestParam(required = false) Long executionerId, @RequestParam(required = false) Long creatorId, @RequestParam(required = false) Long triggeredMetricId) {

        List<PunishmentTask> results = service.findAll();
        List<PunishmentTask> tasksToRemove = new ArrayList<>();

        if (clientId != null) {
            for (PunishmentTask p : results) {
                if (p.getClient() != null && !p.getClient().getId().equals(clientId) && !tasksToRemove.contains(p)) {
                    tasksToRemove.add(p);
                }
            }
        }
//            results.removeIf(e -> !e.getClient().getId().equals(clientId));
        if (executionerId != null) {
            for (PunishmentTask p : results) {
                if (p.getExecutionerId() == null || !p.getExecutionerId().equals(executionerId) && !tasksToRemove.contains(p)) {
                    tasksToRemove.add(p);
                }
            }
        }
//            results.removeIf(e -> !e.getExecutionerId().equals(executionerId));
        if (creatorId != null) {
            for (PunishmentTask p : results) {
                if (p.getCreatorId() == null || !p.getCreatorId().equals(creatorId) && !tasksToRemove.contains(p)) {
                    tasksToRemove.add(p);
                }
            }
        }
//            results.removeIf(e -> !e.getCreatorId().equals(creatorId));
        if (triggeredMetricId != null) {
            for (PunishmentTask p : results) {
                if (p.getTriggeredMetricId() == null || !p.getTriggeredMetricId().equals(clientId) && !tasksToRemove.contains(p)) {
                    tasksToRemove.add(p);
                }
            }
        }
//            results.removeIf(e -> !e.getTriggeredMetricId().equals(triggeredMetricId));
        for (PunishmentTask t : tasksToRemove) {
            results.remove(t);
        }
        return results;
    }

    @Secured({"worker", "manager"})
    @GetMapping
    public List<PunishmentTask> getAll() {
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
            return punishmentTaskRepository.findByExecutionerIdIn(wIds);
        }
        return service.findAll();
    }

    @Secured({"worker"})
    @GetMapping("/{id}")
    public ResponseEntity<PunishmentTask> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PunishmentTaskCreate {
        @Enumerated(EnumType.STRING)
        private String cause;
        private Long clientId;
        private Long creatorId;
    }

    @Secured({"worker", "manager"})
    @PostMapping
    public PunishmentTask create(@RequestBody PunishmentTaskCreate entity) {
        PunishmentTask pt = new PunishmentTask();
        pt.setExecutionerId(workerService.findMostFreeCorrectionsOfficer().getId());
        pt.setCreatorId(entity.getCreatorId());
        pt.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        Client client = clientService.findById(entity.getClientId()).get();
        pt.setClient(client);
        pt.setCause(entity.getCause());
        return service.create(pt, client);
    }

    @Secured({"worker"})
    @PutMapping("/{id}")
    public ResponseEntity<PunishmentTask> update(@PathVariable Long id, @RequestBody PunishmentTask entity) {
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

    @Secured({"manager", "worker"})
    @PatchMapping("/{id}")
    public ResponseEntity<PunishmentTask> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        PunishmentTask toBePatched = objectMapper.convertValue(entity, PunishmentTask.class);
        toBePatched.setId(id);
        return ResponseEntity.ok(service.patch(toBePatched));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
