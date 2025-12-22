package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.Client;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.repository.CrudRepository;

//public interface ClientRepository extends CrudRepository<Client, Long> {
public interface ClientRepository extends JpaRepository<Client, Long> {
    Optional<Client> findByEmail(String email);
    List<Client> findByMonitoringOfficers_Id(Long id);
}
