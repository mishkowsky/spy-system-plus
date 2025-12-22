package com.itmo.spy_system.dto;

import com.itmo.spy_system.entity.Weekday;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.Getter;
import lombok.Setter;

import java.sql.Time;

@Getter
@Setter
public class MonitoringTimeIntervalDTO {
    private Long clientId;
    private Long workerId;
    private Time begin;
    private Time ending;
    @Enumerated(EnumType.STRING)
    private Weekday weekday;
}
