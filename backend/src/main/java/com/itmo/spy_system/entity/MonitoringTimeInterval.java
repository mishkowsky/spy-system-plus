package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Time;

@Entity
@Table(name = "monitoring_interval")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonitoringTimeInterval {

    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="mti_seq")
    @SequenceGenerator(
            name="mti_seq",
            sequenceName="mti_sequence",
            allocationSize=1
    )
    private Long id;

    @ManyToOne
    @JoinColumn(name = "workerId")
    private Worker worker;

    @ManyToOne
    @JoinColumn(name = "clientId")
    private Client client;
    private Time begin;
    private Time ending;
    @Enumerated(EnumType.STRING)
    private Weekday weekday;
}
