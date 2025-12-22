package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.TimeInterval;
import com.itmo.spy_system.service.TimeIntervalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/time_intervals")
@RequiredArgsConstructor
public class TimeIntervalController {
    private final TimeIntervalService service;

    @Autowired
    ObjectMapper objectMapper;

    @Secured({"manager", "worker"})
    @GetMapping("/filtered")
    public List<TimeInterval> getFiltered(@RequestParam(required = false) Long workerId, @RequestParam(required = false) Long managerId) {
        List<TimeInterval> results = service.findAll();
        if (workerId != null) {
            results.removeIf(e -> e.getWorkerId() == null);
            results.removeIf(e -> !e.getWorkerId().equals(workerId));
        }
        if (managerId != null) {
            results.removeIf(e -> e.getManagerId() == null);
            results.removeIf(e -> !e.getManagerId().equals(managerId));
        }
        return results;
    }

    @Secured({"manager"})
    @GetMapping
    public List<TimeInterval> getAll() {
        return service.findAll();
    }

    @Secured({"manager", "worker"})
    @GetMapping("/{id}")
    public ResponseEntity<TimeInterval> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Secured({"manager"})
    @PostMapping
    public ResponseEntity<TimeInterval> create(@RequestBody TimeInterval entity) {
        try {
            return ResponseEntity.ok(service.save(entity));
        } catch (Exception e) {
            return ResponseEntity.unprocessableEntity().build();
        }
    }

    @Secured({"manager"})
    @PutMapping("/{id}")
    public ResponseEntity<TimeInterval> update(@PathVariable Long id, @RequestBody TimeInterval entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        entity.setId(id);
        return ResponseEntity.ok(service.save(entity));
    }

    @Secured({"manager"})
    @DeleteMapping("/{id}")
    public boolean delete(@PathVariable Long id) {
        service.deleteById(id);
        return true;
    }

    @Secured({"manager"})
    @PatchMapping("/{id}")
    public ResponseEntity<TimeInterval> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        TimeInterval toBePatched = objectMapper.convertValue(entity, TimeInterval.class);
        toBePatched.setId(id);
        return ResponseEntity.ok(service.patch(toBePatched));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
