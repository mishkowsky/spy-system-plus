package com.itmo.spy_system.controller;

import com.itmo.spy_system.dto.ClientMapper;
import com.itmo.spy_system.dto.ClientWithDetailsDto;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.*;
import com.itmo.spy_system.service.ClientService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.service.NotificationService;
import com.itmo.spy_system.utils.EmailAlreadyExistsException;
import com.itmo.spy_system.utils.EmailChecker;
import com.itmo.spy_system.utils.WrongOldPasswordException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.util.*;

@CrossOrigin
@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController extends BaseExceptionHandler {
    private final ClientService clientService;
    private final EmailChecker ec;
    private final PasswordEncoder passwordEncoder;
    private final MetricRepository metricRepository;
    private final WorkerRepository workerRepository;
    private final NotificationService notificationService;
    private final ContractRepository contractRepository;
    private final ManagerRepository managerRepository;
    private final ClientRepository clientRepository;

    private final ClientMapper mapper;

    @Secured({"manager", "worker"})
    @GetMapping
    public List<ClientWithDetailsDto> getAllClients() {
        List<Client> results = clientService.findAll();
        results.removeIf(e -> e.getDeletedAt() != null);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("manager"));
        boolean isWorker = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("worker"));

        List<Client> clientsToRemove = new ArrayList<>();
        if (isManager) {
            String managerEmail = authentication.getName();
            Manager m = managerRepository.findByEmail(managerEmail).get();
            List<Contract> res = contractRepository.findBySignerId(m.getId());
            Set<Client> cs = new HashSet<>();
            for (Contract c : res) {
                cs.add(c.getClient());
            }
            List<ClientWithDetailsDto> result = new ArrayList<>();
            for (Client c : cs) result.add(mapper.toDto(c));
            return result;
        }
        if (isWorker) {
            String workerEmail = authentication.getName();
            Worker w = workerRepository.findByEmail(workerEmail).get();
            List<Client> clients = clientService.getClientsByWorker(w);
            List<ClientWithDetailsDto> result = new ArrayList<>();
            for (Client c : clients) result.add(mapper.toDto(c));
            return result;
//            return clientRepository.findByMonitoringOfficers_Id(w.getId());
        }
        List<ClientWithDetailsDto> dtoResult = new ArrayList<>();
        for (Client c : results) dtoResult.add(mapper.toDto(c));
        return dtoResult;
    }

    @Secured({"manager", "worker"})
    @GetMapping("/{id}/metrics/latest")
    public ResponseEntity<Metric> getLatestMetric(@PathVariable Long id) {
        Optional<Metric> o = metricRepository.findTopByClientIdOrderByTimestampDesc(id);
        return ResponseEntity.of(o);
    }

    @Secured({"client", "manager", "worker"})
    @GetMapping("/{id}")
    public ResponseEntity<ClientWithDetailsDto> getClient(@PathVariable Long id) {
        Optional<Client> clientOpt = clientService.findById(id);
        if (clientOpt.isEmpty() || clientOpt.get().getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        } else {
            return ResponseEntity.ok(mapper.toDto(clientOpt.get()));
        }
    }

    @PostMapping()
    public Client createClient(@RequestBody Client client) throws EmailAlreadyExistsException {
        if (ec.isEmailTaken(client.getEmail())) {
            throw new EmailAlreadyExistsException("This email already exists in system");
        }
        client.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        client.setCanCreateNewContract(true);
        return clientService.save(client);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasswordChange {
        private String currentPassword;
        private String newPassword;
    }

    @Secured({"client"})
    @PatchMapping("/{id}/password")
    public ResponseEntity<ClientWithDetailsDto> updatePassword(@PathVariable Long id, @RequestBody PasswordChange pc) throws WrongOldPasswordException {
        Optional<Client> clientMatch = clientService.findById(id);
        if (clientMatch.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Client client = clientMatch.get();
        if (!passwordEncoder.matches(pc.currentPassword, client.getPassword())) {
            throw new WrongOldPasswordException("Wrong password provided");
        }
        client.setPassword(pc.newPassword);
        return ResponseEntity.ok(mapper.toDto(clientService.save(client)));
    }

    @Secured({"client", "manager"})
    @PutMapping("/{id}")
    public ResponseEntity<ClientWithDetailsDto> updateClient(@PathVariable Long id, @RequestBody Client updatedClient) {
        if (clientService.findById(id).isEmpty() || clientService.findById(id).get().getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }
        updatedClient.setId(id);
        return ResponseEntity.ok(mapper.toDto(clientService.save(updatedClient)));
    }

    @Secured({"manager"})
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        Optional<Client> clientOpt = clientService.findById(id);
        if (clientOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        } else {
            Client client = clientOpt.get();
            client.setDeletedAt(new Timestamp(System.currentTimeMillis()));
            clientService.save(client);
            return ResponseEntity.noContent().build();
        }
    }

    @Autowired
    ObjectMapper objectMapper;

    @Secured({"manager", "client"})
    @PatchMapping("/{id}")
    public ResponseEntity<ClientWithDetailsDto> patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        if (clientService.findById(id).isEmpty() || clientService.findById(id).get().getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }
        Client toBePatched = objectMapper.convertValue(entity, Client.class);
        toBePatched.setId(id);
        return ResponseEntity.ok(mapper.toDto(clientService.patch(toBePatched)));
    }

    @Secured({"manager"})
    @GetMapping("/{id}/watchers")
    public List<Worker> get_watchers(@PathVariable Long id) {
        return new ArrayList<>(clientService.findById(id).get().getMonitoringOfficers());
    }

    @Secured({"manager"})
    @PostMapping("/{id}/watcher/{watcher_id}")
    public ResponseEntity<ClientWithDetailsDto> assign_worker(@PathVariable Long id, @PathVariable Long watcher_id) {
        Optional<Client> c = clientService.findById(id);
        if (c.isEmpty())
            return ResponseEntity.unprocessableEntity().build();
        Optional<Worker> w = workerRepository.findById(watcher_id);
        if (w.isEmpty())
            return ResponseEntity.unprocessableEntity().build();

        Client client = c.get();
        Worker watcher = w.get();
        client.getMonitoringOfficers().add(watcher);
        clientService.save(client);
        createWorkerNotification(id, client, watcher_id);
        return ResponseEntity.ok(mapper.toDto(client));
    }

    public void createWorkerNotification(Long clientId, Client c, Long workerId) {
        Notification n = new Notification();
        String surname_and_initials = String.format("%s %c. %c.", c.getSurname(), c.getSurname().charAt(0), c.getLastname().charAt(0));
        n.setText(String.format("Вам назаначен новый клиент: %s", surname_and_initials));
        n.setType(NotificationType.NEW_CLIENT_ASSIGNED);
        n.setRelatedEntityId(clientId);
        n.setWorkerId(workerId);
        notificationService.save(n);
    }

    @Secured({"manager"})
    @DeleteMapping("/{id}/watcher/{watcher_id}")
    public ResponseEntity<ClientWithDetailsDto> delete_worker(@PathVariable Long id, @PathVariable Long watcher_id) {
        Optional<Client> c = clientService.findById(id);
        if (c.isEmpty())
            return ResponseEntity.unprocessableEntity().build();
        Optional<Worker> w = workerRepository.findById(watcher_id);
        if (w.isEmpty())
            return ResponseEntity.unprocessableEntity().build();

        Client client = c.get();
        Worker watcher = w.get();
        client.getMonitoringOfficers().remove(watcher);
        clientService.save(client);
        return ResponseEntity.ok(mapper.toDto(client));
    }

//    @ExceptionHandler(IllegalArgumentException.class)
//    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
//    public String handleIllegalArgumentException(IllegalArgumentException ex) {
//        return ex.getMessage();
//    }
//
//    @ExceptionHandler(EmailAlreadyExistsException.class)
//    @ResponseStatus(HttpStatus.CONFLICT)
//    public String handleEmailAlreadyExistsException(EmailAlreadyExistsException ex) {
//        return ex.getMessage();
//    }
//
//    @ExceptionHandler(WrongOldPasswordException.class)
//    @ResponseStatus(HttpStatus.FORBIDDEN)
//    public String handleWrongOldPasswordException(WrongOldPasswordException ex) {
//        return ex.getMessage();
//    }
}
