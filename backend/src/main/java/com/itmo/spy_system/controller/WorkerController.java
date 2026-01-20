package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import com.itmo.spy_system.service.DefaultEmailService;
import com.itmo.spy_system.service.WorkerService;
import com.itmo.spy_system.utils.EmailAlreadyExistsException;
import com.itmo.spy_system.utils.EmailChecker;
import com.itmo.spy_system.utils.ResourceException;
import com.itmo.spy_system.utils.WrongOldPasswordException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@AllArgsConstructor
@RestController
@RequestMapping("/api/workers")
public class WorkerController extends BaseExceptionHandler {
    private final WorkerService service;
    private final PasswordEncoder passwordEncoder;
    private final EmailChecker ec;
    private final DefaultEmailService mailSender;
    private final ManagerRepository managerRepository;
    private final WorkerRepository workerRepository;
    private final WorkerService workerService;

    @Autowired
    ObjectMapper objectMapper;

//    public WorkerController(WorkerService service) {
//        this.service = service;
//    }

    @Secured({"manager", "worker"})
    @GetMapping
    public List<Worker> getAll() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("manager"));
        if (isManager) {
            String managerEmail = authentication.getName();
            Manager m = managerRepository.findByEmail(managerEmail).get();
            return workerRepository.findByManagerId(m.getId());
        }
        else return service.findAll();
    }

    @Secured({"manager"})
    @GetMapping("/all")
    public List<Worker> getAllWorkers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("manager"));
        if (isManager) {
            String managerEmail = authentication.getName();
            Manager m = managerRepository.findByEmail(managerEmail).get();
            if (m.getIsSenior())
                return service.findAll();
        }
        throw new AccessDeniedException("Only senior manager can view all workers");
    }

    @Secured({"manager", "worker"})
    @GetMapping("/{id}")
    public ResponseEntity<Worker> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Secured({"manager"})
    @PostMapping
    public Worker create(@RequestBody Worker entity) throws EmailAlreadyExistsException {
        if (ec.isEmailTaken(entity.getEmail())) {
            throw new EmailAlreadyExistsException("This email already exists in system");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String managerEmail = authentication.getName();
        Manager manager = managerRepository.findByEmail(managerEmail).get();

        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~`!@#$%^&*()-_=+[{]}\\|;:\'\",<.>/?";
        String pwd = RandomStringUtils.random( 15, characters );
        entity.setPassword(pwd);
        entity.setManager(manager);
        System.out.println("SENDING EMAIL");
        mailSender.sendSimpleEmail(entity.getEmail(), "Создание аккаунта", "Для вас был создан аккаунт в системе Spy+\nВаш пароль: " + pwd);
        return service.save(entity);
    }

    @Secured({"manager", "worker"})
    @PutMapping("/{id}")
    public ResponseEntity<Worker> update(@PathVariable Long id, @RequestBody Worker entity) {
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

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasswordChange {
        private String currentPassword;
        private String newPassword;
    }

    @Secured({"worker"})
    @PatchMapping("/{id}/password")
    public ResponseEntity<Worker> updatePassword(@PathVariable Long id, @RequestBody PasswordChange pc) throws WrongOldPasswordException {
        Optional<Worker> workerMatch = service.findById(id);
        if (workerMatch.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Worker worker = workerMatch.get();
        if (!passwordEncoder.matches(pc.currentPassword, worker.getPassword())) {
            throw new WrongOldPasswordException("Wrong password provided");
        }
        worker.setPassword(pc.newPassword);
        return ResponseEntity.ok(service.save(worker));
    }

    @Secured({"manager", "worker"})
    @PatchMapping("/{id}")
    public ResponseEntity<Worker> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Worker toBePatched = objectMapper.convertValue(entity, Worker.class);
        toBePatched.setId(id);
        if (entity.containsKey("managerId")) {
            if (workerService.hasMonitoringTimeIntervals(id)) {
                throw new ResourceException(HttpStatus.CONFLICT, "Can't reassign worker while he has a monitoring schedule.");
            }

            Long managerId = Long.valueOf(entity.get("managerId").toString());

            Optional<Manager> m = managerRepository.findById(managerId);
            if (m.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            Manager manager = m.get();
            toBePatched.setManager(manager);

        }
        return ResponseEntity.ok(service.patch(toBePatched));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleIllegalArgumentException(IllegalArgumentException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public String handleEmailAlreadyExistsException(EmailAlreadyExistsException ex) {
        return ex.getMessage();
    }

    @ExceptionHandler(WrongOldPasswordException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public String handleWrongOldPasswordException(WrongOldPasswordException ex) {
        return ex.getMessage();
    }
}
