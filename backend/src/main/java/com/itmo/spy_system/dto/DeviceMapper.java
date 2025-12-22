package com.itmo.spy_system.dto;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Device;
import com.itmo.spy_system.entity.MonitoringTimeInterval;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Optional;

@Mapper(componentModel = "spring")
//@Mapper(uses = {DeviceMapper.class}, componentModel = "spring")
public abstract class DeviceMapper {

    @Autowired
    protected ClientRepository clientRepository;

    @Mapping(target = "assignedClient", source = "assignedClientId")
    public abstract DeviceWithClientDto toDto(Device entity);

    public Client map(Long clientId) {
        if (clientId == null) {
            return null;
        }
        Optional<Client> opt = clientRepository.findById(clientId);
        return opt.get();
    }
}
