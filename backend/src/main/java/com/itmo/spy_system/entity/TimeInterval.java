package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.*;

@Entity
@Table(name = "time_interval")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeInterval {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="time_interval_seq")
    @SequenceGenerator(
            name="time_interval_seq",
            sequenceName="time_interval_sequence",
            allocationSize=1
    )
    private Long id;
    private Long workerId;
    private Long managerId;
    private Time begin;
    private Time ending;
    @Enumerated(EnumType.STRING)
    private Weekday weekday;
}