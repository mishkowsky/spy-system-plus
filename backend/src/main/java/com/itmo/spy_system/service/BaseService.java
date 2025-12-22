package com.itmo.spy_system.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.entity.Manager;
import com.itmo.spy_system.entity.MonitoringTimeInterval;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import lombok.AllArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@AllArgsConstructor
public class BaseService<E, R extends JpaRepository<E, Long>> {

    R repository;
    private final ObjectMapper objectMapper;

    public List<E> getAll() {
        return repository.findAll();
    }

    public E getById(Long id) {
        Optional<E> opt = repository.findById(id);
        if (opt.isEmpty()) throw new IllegalArgumentException(String.format("Entity with id=%d not found", id));
        return opt.get();
    }

    public E patch(Long id, Map<String, Object> entity) {
        E toBePatched = (E) objectMapper.convertValue(entity, Object.class);
        E fromDb = getById(id);
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return repository.save(fromDb);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
