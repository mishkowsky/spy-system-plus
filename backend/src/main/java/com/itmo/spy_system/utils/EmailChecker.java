package com.itmo.spy_system.utils;

import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;


@AllArgsConstructor
@Service
public class EmailChecker {

    private final WorkerRepository wr;
    private final ClientRepository cr;
    private final ManagerRepository mr;

    public boolean isEmailTaken(String email) {
        if (wr.findByEmail(email).isPresent()) return true;
        if (cr.findByEmail(email).isPresent()) return true;
        if (mr.findByEmail(email).isPresent()) return true;
        return false;
    }
}
