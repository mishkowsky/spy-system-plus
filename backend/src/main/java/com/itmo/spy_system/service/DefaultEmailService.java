package com.itmo.spy_system.service;

import com.itmo.spy_system.utils.ResourceException;
import jakarta.mail.SendFailedException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class DefaultEmailService {

    @Autowired
    public JavaMailSender emailSender;

    @Value("${environment}")
    private String environment;

    public void sendSimpleEmail(String toAddress, String subject, String message) {
        if (!Objects.equals(environment, "prod"))
            return;
        SimpleMailMessage simpleMailMessage = new SimpleMailMessage();
        simpleMailMessage.setFrom("spy.plus@mail.ru");
        simpleMailMessage.setTo(toAddress);
        simpleMailMessage.setSubject(subject);
        simpleMailMessage.setText(message);
        try {
            emailSender.send(simpleMailMessage);
        } catch (MailSendException e) {
            throw new ResourceException(HttpStatus.BAD_REQUEST, "Email does not exists");
        }
    }
}
