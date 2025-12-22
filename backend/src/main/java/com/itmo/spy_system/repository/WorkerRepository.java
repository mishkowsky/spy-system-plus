package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.entity.WorkerRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkerRepository extends JpaRepository<Worker, Long> {
    List<Worker> findByRole(WorkerRole role);

    Optional<Worker> findByEmail(String email);
    List<Worker> findByManagerId(Long managerId);
}
