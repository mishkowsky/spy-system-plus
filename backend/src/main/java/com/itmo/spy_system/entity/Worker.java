package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;

@Entity
@Table(name = "worker")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Worker {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="worker_seq")
    @SequenceGenerator(
            name="worker_seq",
            sequenceName="worker_sequence",
            allocationSize=1
    )
    private Long id;
    @Column(unique = true)
    @Email
    private String email;
    private String password;
    private String name;
    private String surname;
    private String lastname;
    @Enumerated(EnumType.STRING)
    private WorkerRole role;
    @ManyToOne
    private Manager manager;
}