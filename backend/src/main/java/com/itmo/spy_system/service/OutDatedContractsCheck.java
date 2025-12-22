package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.DeviceRepository;
import com.itmo.spy_system.repository.MetricRepository;
import com.itmo.spy_system.repository.NotificationRepository;
import com.itmo.spy_system.utils.Utils;
import lombok.AllArgsConstructor;
import org.aspectj.weaver.ast.Not;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Configuration
@EnableScheduling
@AllArgsConstructor
public class OutDatedContractsCheck {

    private final ContractService contractService;
    private final NotificationService notificationService;
    private final ClientService clientService;

    @Scheduled(fixedRate = 86_400_000) // run every day
    public void checkOutDatedContracts() {
        List<Contract> contracts = contractService.getOutDatedContracts();
        for (Contract c : contracts) {
            Optional<Notification> existing = notificationService.findByTypeAndRelatedEntityId(NotificationType.CONTRACT_OUTDATED, c.getId());
            if (existing.isPresent())
                continue;
            Client client = c.getClient();
            client.setCanCreateNewContract(true);
            clientService.save(client);

            Notification forClient = notificationService.initNotificationWithDefaultValues();
            forClient.setClientId(c.getClient().getId());
            forClient.setType(NotificationType.CONTRACT_OUTDATED);
            forClient.setText("Срок вашего договора истек, вы можете создать новый");
            notificationService.save(forClient);

            Notification forManager = notificationService.initNotificationWithDefaultValues();
            forManager.setManagerId(c.getSigner().getId());
            forManager.setType(NotificationType.CONTRACT_OUTDATED);
            String text = String.format("У клиента %s %c. %c. (#%d) истек срок договора (#%d)",
                    client.getSurname(), client.getName().charAt(0), client.getLastname().charAt(0), client.getId(), c.getId());
            forManager.setText(text);
            c.setStatus(ContractStatus.OUTDATED);
            contractService.save(c);
            notificationService.save(forManager);
        }
    }
}
