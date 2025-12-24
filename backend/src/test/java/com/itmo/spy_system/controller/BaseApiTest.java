package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.*;
import com.itmo.spy_system.service.DefaultEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.sql.Timestamp;

@SpringBootTest(
        properties = {
                "spring.autoconfigure.exclude=" +
                        "org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration," +
                        "org.springframework.boot.autoconfigure.mail.MailSenderValidatorAutoConfiguration"
        }
)
@EntityScan(basePackages = {
        "com.itmo.spy_system.entity"
})
@EnableJpaRepositories(basePackages = {
        "com.itmo.spy_system.repository"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseApiTest {

    @Autowired
    protected MockMvc mockMvc;

    @MockBean
    protected DefaultEmailService defaultEmailService;

    @MockBean
    JavaMailSender javaMailSender;

    @MockBean
    JavaMailSenderImpl javaMailSenderImpl;
    @Autowired
    JdbcTemplate jdbcTemplate;

    @Autowired
    protected ClientRepository clientRepository;

    @Autowired
    protected ManagerRepository managerRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected ContractRepository contractRepository;

    @Autowired
    protected DeviceRepository deviceRepository;

    @Autowired
    protected MetricRepository metricRepository;

    protected Manager seniorManager;
    protected String seniorManagerUsername;
    protected String seniorManagerPassword;

    protected Manager manager;
    protected String managerUsername;
    protected String managerPassword;

    protected Client client;
    protected String clientUsername;
    protected String clientPassword;

    protected Client clientA;
    protected Client clientB;

    protected Device assignedDevice;
    protected Device freeDevice;

    protected Contract contract;

    @BeforeEach
    void setUpData() {

        contractRepository.deleteAll();
        clientRepository.deleteAll();
        managerRepository.deleteAll();

        seniorManager = new Manager();
        seniorManagerUsername = "senior@mail.com";
        seniorManagerPassword = "senior";
        seniorManager.setEmail(seniorManagerUsername);
        seniorManager.setPassword(passwordEncoder.encode(seniorManagerPassword));
        seniorManager.setIsSenior(true);
        managerRepository.save(seniorManager);

        manager = new Manager();
        managerUsername = "manager@mail.com";
        managerPassword = "manager";
        manager.setEmail(managerUsername);
        manager.setPassword(passwordEncoder.encode(managerPassword));
        manager.setIsSenior(false);
        managerRepository.save(manager);

        client = new Client();
        clientUsername = "client@mail.com";
        clientPassword = "client";
        client.setEmail(clientUsername);
        client.setPassword(passwordEncoder.encode(clientPassword));
        clientRepository.save(client);

        clientA = new Client();
        clientA.setName("Client A");
        clientA.setEmail("a@mail.com");
        clientA.setMetricThreshold(50);
        clientRepository.save(clientA);

        Metric metric = new Metric();
        metric.setClientId(clientA.getId());
        metric.setValue(10);
        metric.setLatitude(60.0);
        metric.setLongitude(30.25);
        metric.setTimestamp(new Timestamp(System.currentTimeMillis()));
        metricRepository.save(metric);

        Metric metric2 = new Metric();
        metric2.setClientId(clientA.getId());
        metric2.setValue(15);
        metric2.setLatitude(60.0);
        metric2.setLongitude(30.2);
        metric2.setTimestamp(new Timestamp(System.currentTimeMillis()));
        metricRepository.save(metric2);

        clientB = new Client();
        clientB.setName("Client B");
        clientB.setEmail("b@mail.com");
        clientRepository.save(clientB);

        Metric metric3 = new Metric();
        metric3.setClientId(clientB.getId());
        metric3.setValue(15);
        metric3.setLatitude(60.0);
        metric3.setLongitude(30.15);
        metric3.setTimestamp(new Timestamp(System.currentTimeMillis()));
        metricRepository.save(metric3);

        contract = new Contract();
        contract.setClient(client);
        contract.setStatus(ContractStatus.CREATED);
        contract.setSigner(manager);
        contractRepository.save(contract);

        assignedDevice = new Device();
        assignedDevice.setDeviceId(1L);
        assignedDevice.setStatus(DeviceStatus.ACTIVE);
        assignedDevice.setAssignedClientId(client.getId());
        assignedDevice.setBatteryLevel(100);
        assignedDevice.setAssignmentStatus(DeviceAssignmentStatus.ASSIGNED);
        deviceRepository.save(assignedDevice);

        freeDevice = new Device();
        freeDevice.setDeviceId(2L);
        freeDevice.setStatus(DeviceStatus.ACTIVE);
        freeDevice.setBatteryLevel(100);
        freeDevice.setAssignmentStatus(DeviceAssignmentStatus.UNASSIGNED);
        deviceRepository.save(freeDevice);
    }

    protected RequestPostProcessor seniorManagerAuth() {
        return basicAuth(seniorManagerUsername, seniorManagerPassword);
    }

    protected RequestPostProcessor managerAuth() {
        return basicAuth(managerUsername, managerPassword);
    }

    protected RequestPostProcessor clientAuth() {
        return basicAuth(clientUsername, clientPassword);
    }

    protected RequestPostProcessor basicAuth(String user, String pass) {
        return SecurityMockMvcRequestPostProcessors.httpBasic(user, pass);
    }
}
