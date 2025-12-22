package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Contract;
import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.repository.ContractRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ManagerService {
    private final ManagerRepository managerRepository;
    private final PasswordEncoder passwordEncoder;
    private final ContractRepository contractRepository;

    public List<Manager> findAll() {
        return managerRepository.findAll();
    }

    public Optional<Manager> findById(Long id) {
        return managerRepository.findById(id);
    }

    public Manager save(Manager manager) {
        if (manager.getPassword() != null) {
            manager.setPassword(passwordEncoder.encode(manager.getPassword()));
        }
        return managerRepository.save(manager);
    }

    public Set<Long> getRelatedClientIds(Manager m) {
        List<Contract> res = contractRepository.findBySignerId(m.getId());
        Set<Long> clientIds = new HashSet<>();
        for (Contract c : res) {
            clientIds.add(c.getClient().getId());
        }
        return clientIds;
    }

    public Manager patch(Manager toBePatched) {
        Manager fromDb = managerRepository.findById(toBePatched.getId()).get();
        if (toBePatched.getPassword() != null) {
            toBePatched.setPassword(passwordEncoder.encode(toBePatched.getPassword()));
        }
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return managerRepository.save(fromDb);
    }

    public void deleteById(Long id) {
        managerRepository.deleteById(id);
    }
}
