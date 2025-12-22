package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.*;

@Entity
@Table(name = "metric")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Metric {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="metric_seq")
    @SequenceGenerator(
            name="metric_seq",
            sequenceName="metric_sequence",
            allocationSize=1
    )
    private Long id;
    private Long deviceId;
    private Integer value;
    private Timestamp timestamp;
    private Long clientId;

    private Double longitude;
    private Double latitude;
}