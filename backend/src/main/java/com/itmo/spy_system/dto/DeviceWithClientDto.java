package com.itmo.spy_system.dto;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.DeviceAssignmentStatus;
import com.itmo.spy_system.entity.DeviceStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;

@Getter
@Setter
public class DeviceWithClientDto {
    private Long deviceId;
    private Integer batteryLevel;
    private Client assignedClient;
    private Long assignedClientId;
    private DeviceAssignmentStatus assignmentStatus;
    private DeviceStatus status;
    private Timestamp lastActiveTime;
}
