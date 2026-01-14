package com.itmo.spy_system.utils;

import com.itmo.spy_system.entity.Contract;
import com.itmo.spy_system.entity.Device;
import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.repository.ContractRepository;
import com.itmo.spy_system.repository.DeviceRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@AllArgsConstructor
@Service
public class Utils {

    private final ManagerRepository managerRepository;
    private final DeviceRepository deviceRepository;
    private final ContractRepository contractRepository;

    public Manager getManagerByDeviceId(Long deviceId) {
        Optional<Device> optD = deviceRepository.findById(deviceId);
        if (optD.isEmpty()) return null;
        Device d = optD.get();
        Long assignedClientId = d.getAssignedClientId();
        if (assignedClientId == null) return null;
        List<Contract> cs = contractRepository.findByClientId(assignedClientId);
        if (cs.isEmpty()) return null;
        Contract c = cs.get(0);
        return c.getSigner();
    }



}
