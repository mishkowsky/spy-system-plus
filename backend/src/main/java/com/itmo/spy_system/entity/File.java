package com.itmo.spy_system.entity;

import jakarta.persistence.*;
import lombok.*;

import java.sql.*;
import java.time.*;

@Entity
@Table(name = "file")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class File {
    @Id
    private String path;
    private String name;
    private Long uploaderId;
}