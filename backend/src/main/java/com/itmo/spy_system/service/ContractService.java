package com.itmo.spy_system.service;

import com.itmo.spy_system.controller.ContractController;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.ContractRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import com.itmo.spy_system.utils.ResourceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class ContractService {
    private final ContractRepository repository;
    private final NotificationService notificationService;
    private final ManagerRepository managerRepository;
    private final ClientRepository clientRepository;

    public List<Contract> findAll() {
        return repository.findAll();
    }

    public Optional<Contract> findById(Long id) {
        return repository.findById(id);
    }

    public boolean validate(Contract c) {
        if (c.getEndDate() != null && c.getEndDate().before(new Date(System.currentTimeMillis())))
            throw new ResourceException(HttpStatus.BAD_REQUEST, "End date can't be in the past");

        return true;
    }

    public Contract create(ContractController.ContractCreate create) {
        if (create.getEndDate() != null && create.getEndDate().before(new Date(System.currentTimeMillis()))) {
            throw new IllegalArgumentException("End date can't be in the past");
        }

        Contract entity = new Contract();

        entity.setStatus(create.getStatus());
        entity.setFilename(create.getFilepath().substring(28));
        entity.setFilepath(create.getFilepath());
        entity.setClientDetails(create.getClientDetails());
        entity.setStartDate(create.getStartDate());
        entity.setEndDate(create.getEndDate());

        Client client = clientRepository.findById(create.getClientId()).get();
        entity.setClient(client);
        boolean hasContract = repository.existsByClientIdAndStatusIn(create.getClientId(), List.of(ContractStatus.ACTIVE, ContractStatus.SEND_TO_CLIENT, ContractStatus.SIGNED));
        if (hasContract) throw new ResourceException(HttpStatus.FORBIDDEN, "You already have one active contract");
        client.setCanCreateNewContract(false);
        clientRepository.save(client);

        entity.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        Long managerId = getManagerWithLeastContracts();
        Manager m = managerRepository.findById(managerId).get();
        entity.setSigner(m);

        Contract createdContract = repository.save(entity);
        log.info("Contract created: {}", createdContract);

        Notification n = new Notification();
        n.setText("Создан новый договор");
        n.setType(NotificationType.CONTRACT_CREATION);
        n.setRelatedEntityId(createdContract.getId());
        n.setManagerId(entity.getSigner().getId());
        notificationService.save(n);
        log.info("Notification created: {}", n);
        return createdContract;
    }

    public Contract save(Contract updated) {
        Contract fromDB = repository.findById(updated.getId()).get();
        if (updated.getStatus() == ContractStatus.SEND_TO_CLIENT && fromDB.getStatus() == ContractStatus.CREATED) {
//            updated.setSignedAt(new Timestamp(System.currentTimeMillis()));
            createContractStatusUpdateNotification(fromDB.getClient().getId(), fromDB.getId());
        }
        if (updated.getStatus() == ContractStatus.SIGNED && fromDB.getStatus() == ContractStatus.SEND_TO_CLIENT) {
            updated.setSignedAt(new Timestamp(System.currentTimeMillis()));
//            createContractClientSignedNotification();
            createContractClientSignedNotification(fromDB.getSigner().getId(), fromDB.getId());
        }
        return repository.save(updated);
    }

    public List<Contract> getOutDatedContracts() {
        Date today = new java.sql.Date(System.currentTimeMillis());
        return repository.findByEndDateBeforeAndStatusNot(today, ContractStatus.OUTDATED);
    }

    public Contract patch(Contract toBePatched) {
        Contract fromDb = repository.findById(toBePatched.getId()).get();
        if (toBePatched.getStatus() == ContractStatus.SEND_TO_CLIENT && fromDb.getStatus() == ContractStatus.CREATED) {
//            toBePatched.setSignedAt(new Timestamp(System.currentTimeMillis()));
            createContractStatusUpdateNotification(fromDb.getClient().getId(), fromDb.getId());
        }
        if (toBePatched.getStatus() == ContractStatus.SIGNED && fromDb.getStatus() == ContractStatus.SEND_TO_CLIENT) {
            toBePatched.setSignedAt(new Timestamp(System.currentTimeMillis()));
            createContractClientSignedNotification(fromDb.getSigner().getId(), fromDb.getId());
        }
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        fromDb.setEndDate(toBePatched.getEndDate());
        validate(fromDb);
        return repository.save(fromDb);
    }

    private void createContractStatusUpdateNotification(Long clientId, Long contractId) {
        Notification n = new Notification();
        n.setClientId(clientId);
        n.setType(NotificationType.CONTRACT_STATUS_UPDATE);
        n.setText("Договор ожидает вашего подписания");
        n.setRelatedEntityId(contractId);
        notificationService.save(n);
        log.info("Notification created: {}", n);
    }

    private void createContractClientSignedNotification(Long managerId, Long contractId) {
        Notification n = new Notification();
        n.setManagerId(managerId);
        n.setType(NotificationType.CONTRACT_STATUS_UPDATE);
        n.setText(String.format("Договор (#%d) подписан клиентом", contractId));
        n.setRelatedEntityId(contractId);
        notificationService.save(n);
        log.info("Notification created: {}", n);
    }

    public Long getManagerWithLeastContracts() {
        return repository.getManagerIdWithLeastContracts();
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public List<Contract> findByClientId(Long clientId) {
        return repository.findByClientId(clientId);
    }
}
