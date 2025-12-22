package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "manager")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Manager {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="manager_seq")
    @SequenceGenerator(
            name="manager_seq",
            sequenceName="manager_sequence",
            allocationSize=1
    )
    private Long id;
    @Column(unique = true)
    private String email;
    private String password;
    private String name;
    private String surname;
    private String lastname;
    private Boolean isSenior;
}