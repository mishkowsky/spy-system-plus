package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.entity.ResetToken;
import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.ResetTokenRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import com.itmo.spy_system.service.PasswordResetService;
import lombok.Data;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.sql.Timestamp;
import java.util.Base64;
import java.util.Optional;

@CrossOrigin
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final ClientRepository clientRepository;
    private final ManagerRepository managerRepository;
    private final WorkerRepository workerRepository;
    private final ResetTokenRepository resetTokenRepository;

    @Data
    @RequiredArgsConstructor
    public static class LoginRequest {
        private final String username;
        private final String password;
    }

    @Data
    @RequiredArgsConstructor
    public static class LoginResponse {
        private final boolean success;
        private final LoginResponseData data;
    }

    @Data
    @RequiredArgsConstructor
    public static class LoginResponseData {
        private final Object user;
        private final String token;
    }

    @Data
    public static class ClientWithRole {
        private Long id;
        private String email;
        private String password;
        private String name;
        private String surname;
        private String lastname;
        private Integer violationsCount;
        private Integer metricThreshold;
        private Timestamp createdAt;
        private Timestamp updatedAt;
        private Timestamp deletedAt;
        private String role;
        private Boolean canCreateNewContract;
        public ClientWithRole(Client c, String role) {
            this.id = c.getId();
            this.email = c.getEmail();
            this.password = c.getPassword();
            this.name = c.getName();
            this.surname = c.getSurname();
            this.lastname = c.getLastname();
            this.violationsCount = c.getViolationsCount();
            this.metricThreshold = c.getMetricThreshold();
            this.createdAt = c.getCreatedAt();
            this.updatedAt = c.getUpdatedAt();
            this.deletedAt = c.getDeletedAt();
            this.role = role;
            this.canCreateNewContract = c.getCanCreateNewContract();
        }
    }

    @Data
    public static class ManagerWithRole {
        private Long id;
        private String email;
        private String password;
        private String name;
        private String surname;
        private String lastname;
        private String role;
        private boolean isSenior;
        public ManagerWithRole(Manager m, String role) {
            this.id = m.getId();
            this.email = m.getEmail();
            this.password = m.getPassword();
            this.name = m.getName();
            this.surname = m.getSurname();
            this.lastname = m.getLastname();
            this.role = role;
            this.isSenior = m.getIsSenior();
        }
    }

    @Secured({"client", "manager", "worker"})
    @PostMapping("/login")
    public AuthController.LoginResponse login(LoginRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Optional<Client> c_profile = clientRepository.findByEmail(userDetails.getUsername());
        if (c_profile.isPresent()) {
            return new AuthController.LoginResponse(true, new LoginResponseData(new ClientWithRole(c_profile.get(), "client"), createAuthHeader(request.username, request.password)));
        }
        Optional<Worker> w_profile = workerRepository.findByEmail(userDetails.getUsername());
        if (w_profile.isPresent()) {
            return new AuthController.LoginResponse(true, new LoginResponseData(w_profile.get(), createAuthHeader(request.username, request.password)));
        }
        Optional<Manager> m_profile = managerRepository.findByEmail(userDetails.getUsername());
        if (m_profile.isPresent()) {
            return new AuthController.LoginResponse(true, new LoginResponseData(new ManagerWithRole(m_profile.get(), "manager"), createAuthHeader(request.username, request.password)));
        }
        throw new RuntimeException("User not found");
//        AuthController.LoginResponse res = new AuthController.LoginResponse(userDetails, createAuthHeader(request.username, request.password));
//        return res;
    }

    private static String createAuthHeader(String username, String password) {
        String credentials = username + ":" + password;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes());
        return "Basic " + encoded;
    }

    @Autowired
    private PasswordResetService resetService;

    public static class ResetRequest {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public class StringResponse {
        @Getter
        private String response;

        public StringResponse(String s) {
            this.response = s;
        }

        // get/set omitted...
    }

    @PostMapping("/reset-password")
    public ResponseEntity<StringResponse> requestReset(@RequestBody ResetRequest request) {
        String email = request.getEmail();
        boolean userFound = false;

        Client client = clientRepository.findByEmail(email).orElse(null);
        if (client != null) {
            userFound = true;
        }

        Manager manager = managerRepository.findByEmail(email).orElse(null);
        if (manager != null) {
            userFound = true;
        }

        Worker worker = workerRepository.findByEmail(email).orElse(null);
        if (worker != null) {
            userFound = true;
        }

        if (userFound)
            resetService.processRequest(email);
        return ResponseEntity.ok(new StringResponse("If the email is registered, you'll get a reset link"));
    }

    @GetMapping("/validate-token")
    public ResponseEntity<StringResponse> validateToken(@RequestParam("token") String token) {
        Optional<ResetToken> tokenOpt = resetTokenRepository.findByToken(token);

        if (tokenOpt.isEmpty() || tokenOpt.get().isExpired()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new StringResponse("Ссылка недействительна"));
        }

        return ResponseEntity.ok(new StringResponse("Token is valid"));
    }

    private final PasswordEncoder passwordEncoder;

    public static class ResetPasswordRequest {
        private String token;
        private String newPassword;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    @PostMapping("/reset-password/confirm")
    public ResponseEntity<StringResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        Optional<ResetToken> tokenOpt = resetTokenRepository.findByToken(request.getToken());

        if (tokenOpt.isEmpty() || tokenOpt.get().isExpired()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new StringResponse("Token is invalid or expired"));
        }
        boolean success = false;

        ResetToken tokenRecord = tokenOpt.get();
        Client client = tokenRecord.getClient();
        if (client != null) {
            client.setPassword(passwordEncoder.encode(request.getNewPassword()));
            clientRepository.save(client);
            success = true;
        }

        Manager manager = tokenRecord.getManager();
        if (manager != null) {
            manager.setPassword(passwordEncoder.encode(request.getNewPassword()));
            managerRepository.save(manager);
            success = true;
        }

        Worker worker = tokenRecord.getWorker();
        if (worker != null) {
            worker.setPassword(passwordEncoder.encode(request.getNewPassword()));
            workerRepository.save(worker);
            success = true;
        }
        if (success)
            resetTokenRepository.delete(tokenRecord);
        return ResponseEntity.ok(new StringResponse("Password updated"));
    }
}
