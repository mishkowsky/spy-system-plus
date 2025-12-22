package com.itmo.spy_system.dto;

import com.itmo.spy_system.entity.Contract;
import com.itmo.spy_system.entity.Worker;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Timestamp;
import java.util.Set;

@Getter
@Setter
public class ClientWithDetailsDto {
    private Long id;
    private Set<Worker> monitoringOfficers;
    private String email;
    private String password;
    private String name;
    private String surname;
    private String lastname;
    private Integer violationsCount;
    private Integer metricThreshold;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private Timestamp deletedAt;
    private Boolean canCreateNewContract;
    private Contract latestContract;
}
