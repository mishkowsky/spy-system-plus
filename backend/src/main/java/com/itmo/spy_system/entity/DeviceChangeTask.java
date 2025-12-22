package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Entity
@Table(name = "device_change_task")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceChangeTask {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="dct_seq")
    @SequenceGenerator(
            name="dct_seq",
            sequenceName="dct_sequence",
            allocationSize=1
    )
    private Long id;
    @Enumerated(EnumType.STRING)
    private TaskStatus status;

    @ManyToOne
    @JoinColumn(name = "clientId")
    private Client client;

    private Long oldDeviceId;
    private Long newDeviceId;

    private Long executionerId;
    private Long creatorId;
    private Timestamp createdAt;
    private Timestamp doneAt;

}