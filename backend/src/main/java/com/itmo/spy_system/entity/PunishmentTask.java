package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.*;

@Entity
@Table(name = "punishment_task")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PunishmentTask {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="punishment_task_seq")
    @SequenceGenerator(
            name="punishment_task_seq",
            sequenceName="punishment_task_sequence",
            allocationSize=1
    )
    private Long id;
    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    @ManyToOne
//    @Column(insertable=false, updatable=false)
    @JoinColumn(name = "clientId")
    private Client client;

//    private Long clientId;
    private Long executionerId;
    @Enumerated(EnumType.STRING)
    private PunishmentType type;
    private Long creatorId;
    private Long triggeredMetricId;
    private Timestamp createdAt;
    private Timestamp doneAt;

    private String cause;
}