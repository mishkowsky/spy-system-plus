package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetToken {

    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="reset_token_seq")
    @SequenceGenerator(
            name="reset_token_seq",
            sequenceName="reset_token_sequence",
            allocationSize=1
    )
    private Long id;

    private String token;

    private Timestamp expiresAt;

    @ManyToOne
    private Client client;

    @ManyToOne
    private Manager manager;

    @ManyToOne
    private Worker worker;

    public boolean isExpired() {
        return expiresAt.toInstant().isBefore(new Timestamp(System.currentTimeMillis()).toInstant());
    }
}
