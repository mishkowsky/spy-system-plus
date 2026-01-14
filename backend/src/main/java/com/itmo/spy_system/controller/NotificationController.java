package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Notification;
import com.itmo.spy_system.repository.NotificationRepository;
import com.itmo.spy_system.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService service;
    private final NotificationRepository repository;

    public NotificationController(NotificationService service, NotificationRepository repository) {
        this.service = service;
        this.repository = repository;
    }

    @GetMapping("/filtered")
    public List<Notification> getFiltered(@RequestParam(required = false) Long clientId, @RequestParam(required = false) Long workerId, @RequestParam(required = false) Long managerId) {
        List<Notification> results = null;
        if (clientId != null) {
            results = repository.findByClientIdOrderByCreatedAtDesc(clientId);
        }
        if (workerId != null)  {
            results = repository.findByWorkerIdOrderByCreatedAtDesc(workerId);
        }
        if (managerId != null)  {
            results = repository.findByManagerIdOrderByCreatedAtDesc(managerId);
        }
        if (results == null) results = new ArrayList<>();
        return results;
    }

    @GetMapping
    public List<Notification> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Notification create(@RequestBody Notification entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Notification> update(@PathVariable Long id, @RequestBody Notification entity) {
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

    @PatchMapping("/{id}")
    public ResponseEntity<Notification> patch(@PathVariable Long id, @RequestBody Map<String, Object> notification) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Notification toBePatchedManager = objectMapper.convertValue(notification, Notification.class);
        toBePatchedManager.setId(id);
        return ResponseEntity.ok(service.patch(toBePatchedManager));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
