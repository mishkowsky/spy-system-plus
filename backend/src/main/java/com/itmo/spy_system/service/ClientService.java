
package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClientService {
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final MonitoringService monitoringService;

    public List<Client> getClientsByWorker(Worker w) {
        return new ArrayList<>(monitoringService.getWorkerRelatedClients(w));
    }

    public List<Client> findAll() {
        return clientRepository.findAll();
    }

    public Optional<Client> findById(Long id) {
        return clientRepository.findById(id);
    }

    public Client save(Client client) {
        if (client.getPassword() != null) {
            client.setPassword(passwordEncoder.encode(client.getPassword()));
        }
        return clientRepository.save(client);
    }

    public Client patch(Client toBePatched) {
        if (toBePatched.getPassword() != null) {
            toBePatched.setPassword(passwordEncoder.encode(toBePatched.getPassword()));
        }
        Client fromDb = clientRepository.findById(toBePatched.getId()).get();
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return clientRepository.save(fromDb);
    }

    public void deleteById(Long id) {
        clientRepository.deleteById(id);
    }
}
