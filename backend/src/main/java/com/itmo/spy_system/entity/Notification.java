package com.itmo.spy_system.entity;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Entity
@Table(name = "notification")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="notification_seq")
    @SequenceGenerator(
            name="notification_seq",
            sequenceName="notification_sequence",
            allocationSize=1
    )
    private Long id;
    private String text;

    @Enumerated(EnumType.STRING)
    private NotificationType type;
    private Long relatedEntityId;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status;
    private Long clientId;
    private Long workerId;
    private Long managerId;
    private Timestamp createdAt;

    @PostConstruct
    private void setDefaults() {
        if (this.status == null) {
            this.setStatus(NotificationStatus.UNREAD);
        }
    }
}