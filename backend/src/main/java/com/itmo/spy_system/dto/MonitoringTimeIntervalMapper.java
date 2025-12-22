package com.itmo.spy_system.dto;

import com.itmo.spy_system.entity.MonitoringTimeInterval;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
//@Mapper(uses = {MonitoringTimeIntervalMapper.class}, componentModel = "spring")
public abstract class MonitoringTimeIntervalMapper {

    @Autowired
    protected ClientRepository clientRepository;

    @Autowired
    protected WorkerRepository workerRepository;

    @Mapping(target = "client", expression = "java(clientRepository.getReferenceById(dto.getClientId()))")
    @Mapping(target = "worker", expression = "java(workerRepository.getReferenceById(dto.getWorkerId()))")
    public abstract MonitoringTimeInterval toEntity(MonitoringTimeIntervalDTO dto);

    @Mapping(target = "clientId", source = "client.id")
    @Mapping(target = "workerId", source = "worker.id")
    public abstract MonitoringTimeIntervalDTO toDto(MonitoringTimeInterval entity);
}
