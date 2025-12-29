
package com.itmo.spy_system.utils;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.*;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
@Slf4j
@RequiredArgsConstructor
public class TestDataLoader {

    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final DeviceRepository deviceRepository;
    private final DeviceChangeTaskRepository deviceChangeTaskRepository;
    private final MetricRepository metricRepository;
    private final FileRepository fileRepository;
    private final ManagerRepository managerRepository;
    private final MonitoringTimeIntervalRepository monitoringTimeIntervalRepository;
    private final NotificationRepository notificationRepository;
    private final PunishmentTaskRepository punishmentTaskRepository;
    private final ResetTokenRepository resetTokenRepository;
    private final TimeIntervalRepository timeIntervalRepository;
    private final WorkerRepository workerRepository;

    private final PasswordEncoder passwordEncoder;

    @Value("${environment}")
    private String environment;

    @PostConstruct
    public void loadTestData() {
        log.info("CREATING TEST DATA");
        if (Objects.equals(environment, "test")) {

            return;
        } else
        if (Objects.equals(environment, "hand_test")) {
            log.info("HAND TEST CASE");
            log.info("REMOVING OLD DATA");

            contractRepository.deleteAll();
            deviceChangeTaskRepository.deleteAll();
            metricRepository.deleteAll();
            deviceRepository.deleteAll();
            fileRepository.deleteAll();
            monitoringTimeIntervalRepository.deleteAll();
            notificationRepository.deleteAll();
            punishmentTaskRepository.deleteAll();
            resetTokenRepository.deleteAll();
            timeIntervalRepository.deleteAll();

            clientRepository.deleteAll();
            workerRepository.deleteAll();
            managerRepository.deleteAll();
            log.info("CREATING TEST DATA");

            Manager manager = new Manager();
            manager.setEmail("manager@example.com");
            manager.setPassword(passwordEncoder.encode("managerpass"));
            manager.setName("Менеджер");
            manager.setSurname("Менеджеров");
            manager.setLastname("Егорович");
            manager.setIsSenior(true);
            managerRepository.save(manager);

            Client client = new Client();
            client.setEmail("client@example.com");
            client.setPassword(passwordEncoder.encode("clientpass"));
            client.setName("Клиент");
            client.setSurname("Клиентов");
            client.setLastname("Семенович");
            client.setMetricThreshold(70);
            client.setViolationsCount(0);
            client.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
            client.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now()));
            clientRepository.save(client);

            Device assignedDevice = new Device();
            assignedDevice.setDeviceId(1L);
            assignedDevice.setStatus(DeviceStatus.ACTIVE);
            assignedDevice.setAssignedClientId(client.getId());
            assignedDevice.setBatteryLevel(100);
            assignedDevice.setAssignmentStatus(DeviceAssignmentStatus.ASSIGNED);
            deviceRepository.save(assignedDevice);

            Device freeDevice = new Device();
            freeDevice.setDeviceId(2L);
            freeDevice.setStatus(DeviceStatus.ACTIVE);
            freeDevice.setBatteryLevel(100);
            freeDevice.setAssignmentStatus(DeviceAssignmentStatus.UNASSIGNED);
            deviceRepository.save(freeDevice);

            Metric metric = new Metric();
            metric.setClientId(client.getId());
            metric.setValue(10);
            metric.setLatitude(60.0);
            metric.setLongitude(30.25);
            metric.setTimestamp(new Timestamp(System.currentTimeMillis()));
            metric.setDeviceId(assignedDevice.getDeviceId());
            metricRepository.save(metric);

            Metric metric2 = new Metric();
            metric2.setClientId(client.getId());
            metric2.setValue(15);
            metric2.setLatitude(60.0);
            metric2.setLongitude(30.2);
            metric2.setTimestamp(new Timestamp(System.currentTimeMillis()));
            metric2.setDeviceId(freeDevice.getDeviceId());
            metricRepository.save(metric2);

            Contract contract = new Contract();
            contract.setClient(client);
            contract.setSigner(manager);
            contract.setStatus(ContractStatus.CREATED);
            contract.setFilepath("test.txt");
            contract.setFilename("test.txt");
            contract.setStartDate(new Date(System.currentTimeMillis()));
            contract.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
            contractRepository.save(contract);

            Worker worker = new Worker();
            worker.setEmail("worker@example.com");
            worker.setPassword(passwordEncoder.encode("workerpass"));
            worker.setName("Сотрудник");
            worker.setSurname("Наказаний");
            worker.setLastname("Иванович");
            worker.setRole(WorkerRole.CORRECTIONS_OFFICER);
            worker.setManager(manager);
            workerRepository.save(worker);

            Worker worker2 = new Worker();
            worker2.setEmail("worker2@example.com");
            worker2.setPassword(passwordEncoder.encode("workerpass"));
            worker2.setName("Сотрудник");
            worker2.setSurname("Слежки");
            worker2.setLastname("Петрович");
            worker2.setRole(WorkerRole.SURVEILLANCE_OFFICER);
            worker2.setManager(manager);
            workerRepository.save(worker2);

            return;
        } else
        if (Objects.equals(environment, "prod")) {
            if (managerRepository.findByEmail("admin@system.com").isPresent()) {
                log.info(" DATA ALREADY CREATED");
                return;
            }
            Manager manager = new Manager();
            manager.setEmail("admin@system.com");
            manager.setPassword(passwordEncoder.encode("password"));
            manager.setName("Admin");
            manager.setSurname("System");
            manager.setLastname("Account");
            manager.setIsSenior(true);
            managerRepository.save(manager);
        } else {
            if (clientRepository.findByEmail("client@example.com").isPresent()) {
                log.info("TEST DATA ALREADY CREATED");
                return;
            }
            Client client = new Client();
            client.setEmail("client@example.com");
            client.setPassword(passwordEncoder.encode("clientpass"));
            client.setName("John");
            client.setSurname("Doe");
            client.setLastname("Client");
            client.setMetricThreshold(70);
            client.setViolationsCount(0);
            client.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
            client.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now()));
            clientRepository.save(client);

            Client client2 = new Client();
            client2.setEmail("client2@example.com");
            client2.setPassword(passwordEncoder.encode("clientpass"));
            client2.setName("Ivan");
            client2.setSurname("Ivanov");
            client2.setLastname("Ivanych");
            client2.setMetricThreshold(55);
            client2.setViolationsCount(6);
            client2.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
            client2.setUpdatedAt(Timestamp.valueOf(LocalDateTime.now()));
            clientRepository.save(client2);

            Manager manager = new Manager();
            manager.setEmail("manager@example.com");
            manager.setPassword(passwordEncoder.encode("managerpass"));
            manager.setName("Alice");
            manager.setSurname("Smith");
            manager.setLastname("Manager");
            manager.setIsSenior(true);
            managerRepository.save(manager);

            Manager manager1 = new Manager();
            manager1.setEmail("manager1@example.com");
            manager1.setPassword(passwordEncoder.encode("password"));
            manager1.setName("Alice1");
            manager1.setSurname("Smith1");
            manager1.setLastname("Manager1");
            managerRepository.save(manager1);

            Manager manager2 = new Manager();
            manager2.setEmail("manager2@example.com");
            manager2.setPassword(passwordEncoder.encode("password"));
            manager2.setName("Alice2");
            manager2.setSurname("Smith2");
            manager2.setLastname("Manager2");
            managerRepository.save(manager2);

            Worker worker = new Worker();
            worker.setEmail("worker@example.com");
            worker.setPassword(passwordEncoder.encode("workerpass"));
            worker.setName("Bob");
            worker.setSurname("Brown");
            worker.setLastname("Worker");
            worker.setRole(WorkerRole.CORRECTIONS_OFFICER);
            worker.setManager(manager);
            workerRepository.save(worker);

            Worker worker2 = new Worker();
            worker2.setEmail("worker2@example.com");
            worker2.setPassword(passwordEncoder.encode("workerpass"));
            worker2.setName("Petr");
            worker2.setSurname("Petrov");
            worker2.setLastname("Petrovich");
            worker2.setRole(WorkerRole.SURVEILLANCE_OFFICER);
            worker.setManager(manager);
            workerRepository.save(worker2);

            Device device = new Device();
            device.setDeviceId(1234L);
            device.setStatus(DeviceStatus.ACTIVE);
            device.setBatteryLevel(34);
            device.setAssignedClientId(client.getId());
            device.setAssignmentStatus(DeviceAssignmentStatus.ASSIGNED);
            deviceRepository.save(device);

            Device device2 = new Device();
            device2.setDeviceId(1234L);
            device2.setStatus(DeviceStatus.INACTIVE);
            device2.setBatteryLevel(34);
            device2.setAssignmentStatus(DeviceAssignmentStatus.UNASSIGNED);
            deviceRepository.save(device2);

            Metric m = new Metric();
            m.setDeviceId(device.getDeviceId());
            m.setTimestamp(Timestamp.valueOf(LocalDateTime.now()));
            m.setValue(12);
            metricRepository.save(m);

            Metric m1 = new Metric();
            m1.setDeviceId(device.getDeviceId());
            m1.setTimestamp(Timestamp.valueOf(LocalDateTime.now()));
            m1.setValue(15);
            metricRepository.save(m1);

            Metric m2 = new Metric();
            m2.setDeviceId(device.getDeviceId());
            m2.setTimestamp(Timestamp.valueOf(LocalDateTime.now()));
            m2.setValue(24);
            metricRepository.save(m2);

            Metric m3 = new Metric();
            m3.setDeviceId(device.getDeviceId());
            m3.setTimestamp(Timestamp.valueOf(LocalDateTime.now()));
            m3.setValue(53);
            metricRepository.save(m3);

            Metric m4 = new Metric();
            m4.setDeviceId(device.getDeviceId());
            m4.setTimestamp(Timestamp.valueOf(LocalDateTime.now()));
            m4.setValue(84);
            metricRepository.save(m4);

            TimeInterval interval = new TimeInterval();
            interval.setWorkerId(worker.getId());
            interval.setWeekday(Weekday.MONDAY);
            interval.setBegin(Time.valueOf("09:00:00"));
            interval.setEnding(Time.valueOf("17:00:00"));
            timeIntervalRepository.save(interval);

            Contract contract = new Contract();
            contract.setClient(client);
            contract.setSigner(manager);
            contract.setStatus(ContractStatus.CREATED);
            contract.setFilepath("/files/contract1.pdf");
            contract.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
            contractRepository.save(contract);

            PunishmentTask pt = new PunishmentTask();
            pt.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
            pt.setCause("Кто-то что-то сделал");
            pt.setType(PunishmentType.PHYSICAL);
            pt.setCreatorId(worker2.getId());
            pt.setDoneAt(null);
            pt.setStatus(TaskStatus.NEW);
            pt.setClient(client);
            pt.setExecutionerId(worker.getId());
            punishmentTaskRepository.save(pt);

            Notification n = new Notification();
            n.setWorkerId(worker.getId());
            n.setStatus(NotificationStatus.UNREAD);
            n.setText("Новое задание наказания");
            n.setType(NotificationType.PUNISHMENT_TASK_CREATION);

            DeviceChangeTask dct = new DeviceChangeTask();
            dct.setCreatedAt(Timestamp.valueOf(LocalDateTime.now()));
            dct.setClient(client);
            dct.setNewDeviceId(1L);
            dct.setOldDeviceId(1L);
            dct.setExecutionerId(worker.getId());
            dct.setStatus(TaskStatus.NEW);
            deviceChangeTaskRepository.save(dct);
        }
    }
}
