package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.*;

@Entity
@Table(name = "contract", indexes = {
        @Index(name = "contract_signer_id_index", columnList = "signerId"),
        @Index(name = "contract_client_id_index", columnList = "clientId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contract {
    @Id
    @GeneratedValue(strategy=GenerationType.SEQUENCE, generator="contract_seq")
    @SequenceGenerator(
            name="contract_seq",
            sequenceName="contract_sequence",
            allocationSize=1
    )
    private Long id;
    @Enumerated(EnumType.STRING)
    private ContractStatus status;
    @Column(columnDefinition="TEXT")
    private String filepath;
    @Column(columnDefinition="TEXT")
    private String filename;
    @Column(columnDefinition="TEXT")
    private String clientDetails;
    private Date startDate;
    private Date endDate;

    @ManyToOne
    @JoinColumn(name = "clientId")
    private Client client;
//    private Long clientId;

    @ManyToOne
    @JoinColumn(name = "signerId")
    private Manager signer;
//    private Long signerId;

    private Timestamp createdAt;
    private Timestamp signedAt;
}