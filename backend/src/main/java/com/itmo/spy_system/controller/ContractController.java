package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Contract;
import com.itmo.spy_system.entity.ContractStatus;
import com.itmo.spy_system.service.ContractService;
import com.itmo.spy_system.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController extends BaseExceptionHandler {
    private final ContractService service;
    private final NotificationService notificationService;

    @Autowired
    ObjectMapper objectMapper;

    @Secured({"client", "manager"})
    @GetMapping
    public List<Contract> getAll() {
        return service.findAll();
    }

    @Secured({"manager", "client"})
    @GetMapping("/filtered")
    public List<Contract> getFiltered(@RequestParam(required = false) Long clientId, @RequestParam(required = false) Long signerId) {
        List<Contract> results = service.findAll();
        if (clientId != null) {
            results.removeIf(e -> e.getClient() == null);
            results.removeIf(e -> !e.getClient().getId().equals(clientId));
        }
        if (signerId != null) {
            results.removeIf(e -> e.getSigner() == null);
            results.removeIf(e -> !e.getSigner().getId().equals(signerId));
        }
        return results;
    }

    @Secured({"client", "manager"})
    @GetMapping("/{id}")
    public ResponseEntity<Contract> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContractCreate {
        @Enumerated(EnumType.STRING)
        private ContractStatus status;
        private String filepath;
        private String clientDetails;
        private Date startDate;
        private Date endDate;
        private Long clientId;
    }

    @Secured({"client", "manager"})
    @PostMapping
    public Contract create(@RequestBody ContractCreate entity) {
        return service.create(entity);
    }

    @Secured({"client", "manager"})
    @PutMapping("/{id}")
    public ResponseEntity<Contract> update(@PathVariable Long id, @RequestBody Contract updated) {
        Optional<Contract> fromDB = service.findById(id);
        if (fromDB.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        updated.setId(id);
        return ResponseEntity.ok(service.save(updated));
    }

    @Secured({"manager"})
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @Secured({"client", "manager"})
    @PatchMapping("/{id}")
    public ResponseEntity<Contract> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        Optional<Contract> fromDB = service.findById(id);
        if (fromDB.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Contract updates = objectMapper.convertValue(entity, Contract.class);
        updates.setId(id);
        Contract savedEntity = service.patch(updates);
        return ResponseEntity.ok(savedEntity);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }
}
