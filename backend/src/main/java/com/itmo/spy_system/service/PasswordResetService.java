package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.entity.ResetToken;
import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.ResetTokenRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final DefaultEmailService mailSender;
    private final ClientRepository clientRepository;
    private final ManagerRepository managerRepository;
    private final WorkerRepository workerRepository;
    private final ResetTokenRepository resetTokenRepository;

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder =
            Base64.getUrlEncoder().withoutPadding();

    public String makeResetToken() {
        byte[] randomBytes = new byte[32]; // 256-bit token
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

    public void processRequest(String email) {

        ResetToken record = new ResetToken();

        Client client = clientRepository.findByEmail(email).orElse(null);
        if (client != null) {
            record.setClient(client);
        }

        Manager manager = managerRepository.findByEmail(email).orElse(null);
        if (manager != null) {
            record.setManager(manager);
        }

        Worker worker = workerRepository.findByEmail(email).orElse(null);
        if (worker != null) {
            record.setWorker(worker);
        }

        String token = makeResetToken();


        record.setToken(token);
        record.setExpiresAt(new Timestamp(System.currentTimeMillis() + 30 * 60 * 1000));

        resetTokenRepository.save(record);

        sendEmail(email, token);
    }

    @Value("${APP_URL}")
    private String appUrl;

    public void sendEmail(String email, String token) {
        String resetUrl = appUrl + "/reset-password?token=" + token;
        String body = "Click the link below to reset your password.\n" + resetUrl;

        mailSender.sendSimpleEmail(email, "Password Reset", body);
    }

//    @Configuration
//    @EnableScheduling
//    public class TokenCleanup {
//
//        private final ResetTokenRepository resetTokenRepository;
//
//        public TokenCleanup(ResetTokenRepository resetTokenRepository) {
//            this.resetTokenRepository = resetTokenRepository;
//        }
//
//        @Scheduled(fixedRate = 3_600_000) // runs every hour
//        public void clearExpiredTokens() {
//            resetTokenRepository.deleteAllByExpiresAtBefore(new Timestamp(System.currentTimeMillis()));
//        }
//    }
}
