package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    List<Device> findByAssignedClientId(Long clientId);
    List<Device> findByAssignedClientIdIn(Collection<Long> ids);
    List<Device> findByAssignedClientIdIsNull();
}
