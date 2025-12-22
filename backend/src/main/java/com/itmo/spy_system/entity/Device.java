package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.Timestamp;

@Entity
@Table(name = "device")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Device {
    @Id
    private Long deviceId;
    private Integer batteryLevel;
    private Long assignedClientId;
    @Enumerated(EnumType.STRING)
    private DeviceAssignmentStatus assignmentStatus;

    @Enumerated(EnumType.STRING)
    private DeviceStatus status;
    private Timestamp lastActiveTime;
}