package com.itmo.spy_system.controller;

import com.itmo.spy_system.service.BaseService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

public class BaseController
        <E, S extends BaseService<E, R>, R extends JpaRepository<E, Long>>
        extends BaseExceptionHandler{
    S service;

    @GetMapping
    public List<E> getAll() {
        return service.getAll();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteById(id);
    }

    @PatchMapping("/{id}")
    public E patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        return service.patch(id, entity);
    }
}
