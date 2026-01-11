package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.*;

@Entity
@Table(name = "device_metric", indexes = {
        @Index(name = "device_metric_client_id_index", columnList = "clientId"),
        @Index(name = "device_metric_device_id_index", columnList = "deviceId"),
})
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
    @Column(name="metric_value")
    private Integer value;
    private Timestamp timestamp;
    private Long clientId;

    private Double longitude;
    private Double latitude;
}