package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.service.DefaultEmailService;
import com.itmo.spy_system.service.ManagerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.utils.EmailAlreadyExistsException;
import com.itmo.spy_system.utils.EmailChecker;
import com.itmo.spy_system.utils.WrongOldPasswordException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@AllArgsConstructor
@RestController
@RequestMapping("/api/managers")
public class ManagerController extends BaseExceptionHandler {

    @Autowired
    ObjectMapper objectMapper;
    private final ManagerService service;
    private final PasswordEncoder passwordEncoder;
    private final EmailChecker ec;
    private final ManagerService managerService;
    private final ManagerRepository managerRepository;
    private final DefaultEmailService mailSender;
//    public ManagerController(ManagerService service) {
//        this.service = service;
//    }

    @Secured({"manager"})
    @GetMapping
    public List<Manager> getAll() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String managerEmail = authentication.getName();
        Manager m = managerRepository.findByEmail(managerEmail).get();
        if (!m.getIsSenior()) {
            return new ArrayList<>();
        }
        return service.findAll();
    }

    @Secured({"manager"})
    @GetMapping("/{id}")
    public ResponseEntity<Manager> getById(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String managerEmail = authentication.getName();
        Manager m = managerRepository.findByEmail(managerEmail).get();
        if (!m.getIsSenior()) {
            throw new AccessDeniedException("Only senior manager can view other managers");
        }
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @Secured({"manager"})
    @PostMapping
    public Manager create(@RequestBody Manager entity) throws EmailAlreadyExistsException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String managerEmail = authentication.getName();
        Manager m = managerRepository.findByEmail(managerEmail).get();
        if (!m.getIsSenior()) {
            throw new AccessDeniedException("Only senior manager can create other managers");
        }
        if (ec.isEmailTaken(entity.getEmail())) {
            throw new EmailAlreadyExistsException("This email already exists in system");
        }
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~`!@#$%^&*()-_=+[{]}\\|;:\'\",<.>/?";
        String pwd = RandomStringUtils.random( 15, characters );
        entity.setPassword(pwd);
        mailSender.sendSimpleEmail(entity.getEmail(), "Создание аккаунта", "Для вас был создан аккаунт в системе Spy+\nВаш пароль: " + pwd);

//        entity.setIsSenior(isSenior);
        return service.save(entity);
    }


    @Secured({"manager"})
    @PutMapping("/{id}")
    public ResponseEntity<Manager> update(@PathVariable Long id, @RequestBody Manager entity) {
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

    @Secured({"manager"})
    @PatchMapping("/{id}/password")
    public ResponseEntity<Manager> updatePassword(@PathVariable Long id, @RequestBody PasswordChange pc) throws WrongOldPasswordException {
        Optional<Manager> managerMatch = managerService.findById(id);
        if (managerMatch.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Manager manager = managerMatch.get();
        if (!passwordEncoder.matches(pc.currentPassword, manager.getPassword())) {
            throw new WrongOldPasswordException("Wrong password provided");
        }
        manager.setPassword(pc.newPassword);
        return ResponseEntity.ok(managerService.save(manager));
    }

    @Secured({"manager"})
    @PatchMapping("/{id}")
    public ResponseEntity<Manager> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        if (service.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Manager toBePatched = objectMapper.convertValue(entity, Manager.class);
        toBePatched.setId(id);
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
