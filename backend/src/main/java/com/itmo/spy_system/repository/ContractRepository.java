package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Contract;
import com.itmo.spy_system.entity.ContractStatus;
import com.itmo.spy_system.entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.sql.Date;
import java.util.Collection;
import java.util.List;

public interface ContractRepository extends JpaRepository<Contract, Long> {

    public interface SignerIdCount {
        Long getSignerId();
        Long getCount();
    }

    List<Contract> findBySignerId(Long managerId);
    List<Contract> findByClientId(Long clientId);
    List<Contract> findByEndDateBeforeAndStatusNot(Date someDate, ContractStatus status);
    Boolean existsByClientIdAndStatusIn(Long clientId, Collection<ContractStatus> statuses);

//    @Query("SELECT COUNT(c) AS count FROM Contract c GROUP BY c.signer.id ORDER BY count ASC LIMIT 1")
//    @Query("""
//            SELECT f.id
//            FROM (
//                SELECT p.id, COUNT(c.id) AS reference_count
//                FROM Manager p
//                LEFT JOIN Contract c ON c.signer.id = p.id
//                GROUP BY p.id
//                ORDER BY reference_count ASC
//                LIMIT 1
//            ) as f
//            """)
@Query(value = """
        SELECT m.id
        FROM manager m
        LEFT JOIN contract c ON c.signer_id = m.id
        GROUP BY m.id
        ORDER BY COUNT(c.id) ASC
        LIMIT 1
    """, nativeQuery = true)
    Long getManagerIdWithLeastContracts();
}
