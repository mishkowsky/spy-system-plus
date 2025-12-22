package com.itmo.spy_system.repository;
import com.itmo.spy_system.entity.ResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.sql.Timestamp;
import java.util.Optional;

public interface ResetTokenRepository extends JpaRepository<ResetToken, Long> {
    Optional<ResetToken> findByToken(String token);

    void deleteAllByExpiresAtBefore(Timestamp expires);
}
