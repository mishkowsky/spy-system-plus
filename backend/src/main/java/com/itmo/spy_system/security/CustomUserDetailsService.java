
package com.itmo.spy_system.security;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.repository.ClientRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final ClientRepository clientRepository;
    private final ManagerRepository managerRepository;
    private final WorkerRepository workerRepository;

    public CustomUserDetailsService(ClientRepository clientRepository,
                                    ManagerRepository managerRepository,
                                    WorkerRepository workerRepository) {
        this.clientRepository = clientRepository;
        this.managerRepository = managerRepository;
        this.workerRepository = workerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Client client = clientRepository.findByEmail(email).orElse(null);
        if (client != null) {
            return User.withUsername(client.getEmail()).password(client.getPassword()).authorities("client").build();
        }

        Manager manager = managerRepository.findByEmail(email).orElse(null);
        if (manager != null) {
            return User.withUsername(manager.getEmail()).password(manager.getPassword()).authorities("manager").build();
        }

        Worker worker = workerRepository.findByEmail(email).orElse(null);
        if (worker != null) {
            return User.withUsername(worker.getEmail()).password(worker.getPassword()).authorities("worker").build();
        }

        throw new UsernameNotFoundException("User not found: " + email);
    }
}
//
//public class CustomUserDetails implements UserDetails {
//
//    @Override
//    public Collection<? extends GrantedAuthority> getAuthorities() {
//        return List.of();
//    }
//
//    @Override
//    public String getPassword() {
//        return "";
//    }
//
//    @Override
//    public String getUsername() {
//        return "";
//    }
//}
