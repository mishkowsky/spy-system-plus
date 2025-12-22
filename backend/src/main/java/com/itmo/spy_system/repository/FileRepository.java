package com.itmo.spy_system.repository;

import com.itmo.spy_system.entity.File;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileRepository extends JpaRepository<File, String> {
}
