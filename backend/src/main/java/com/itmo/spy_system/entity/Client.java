package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.sql.Timestamp;
import java.util.Set;

@Entity
@Table(name = "client")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Client {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="client_seq")
    @SequenceGenerator(
            name="client_seq",
            sequenceName="client_sequence",
            allocationSize=1
    )
    private Long id;

    @ManyToMany
    private Set<Worker> monitoringOfficers;

    @Column(unique = true)
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
}
