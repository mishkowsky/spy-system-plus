package com.itmo.spy_system.dto;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Contract;
import com.itmo.spy_system.entity.Device;
import com.itmo.spy_system.entity.MonitoringTimeInterval;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.ContractRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import com.itmo.spy_system.service.ContractService;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Optional;

@Mapper(componentModel = "spring")
//@Mapper(uses = {ClientMapper.class}, componentModel = "spring")
public abstract class ClientMapper {

    @Autowired
    protected ContractService contractService;

    @Mapping(target = "latestContract", source = "id")
    public abstract ClientWithDetailsDto toDto(Client entity);

    public Contract map(Long clientId) {
        List<Contract> cs = contractService.findByClientId(clientId);
        if (cs.isEmpty()) return null;
        Contract contractWithMostLatestStatus = null;
        for (Contract c : cs) {
            if (contractWithMostLatestStatus == null || c.getStatus().compareTo(contractWithMostLatestStatus.getStatus()) > 0)
                contractWithMostLatestStatus = c;
        }
        return contractWithMostLatestStatus;
    }
}
