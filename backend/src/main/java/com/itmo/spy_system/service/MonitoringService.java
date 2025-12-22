package com.itmo.spy_system.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.MonitoringTimeIntervalRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import com.itmo.spy_system.utils.ResourceException;
import com.itmo.spy_system.utils.TimeIntervalClashException;
import com.itmo.spy_system.utils.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringService {

    private final ManagerRepository managerRepository;
    private final WorkerRepository workerRepository;
    private final ManagerService managerService;
    private final MonitoringTimeIntervalRepository repository;
    private final ObjectMapper objectMapper;

    public Object getAuthenticatedEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isManager = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("manager"));
        boolean isWorker = authentication.getAuthorities().stream()
                .anyMatch(r -> r.getAuthority().equals("worker"));
        if (isManager)
            return managerRepository.findByEmail(authentication.getName()).get();
        if (isWorker)
            return workerRepository.findByEmail(authentication.getName()).get();
        return null;
    }

    public List<MonitoringTimeInterval> getAll() {
        Object user = getAuthenticatedEntity();
        if (user instanceof Manager) {
            Set<Long> relatedClientsIds = managerService.getRelatedClientIds((Manager) user);
            return repository.findByClientIdIn(relatedClientsIds);
        }
        if (user instanceof Worker)
            return repository.findByWorkerId(((Worker) user).getId());
        return repository.findAll();
    }

    public MonitoringTimeInterval create(MonitoringTimeInterval m) {
        validate(m);
        return repository.save(m);
    }

    public MonitoringTimeInterval patch(@RequestBody Map<String, Object> entity) {
        MonitoringTimeInterval toBePatched = objectMapper.convertValue(entity, MonitoringTimeInterval.class);

        Optional<MonitoringTimeInterval> opt = repository.findById(toBePatched.getId());
        if (opt.isEmpty())
            throw new IllegalArgumentException("Entity not found");

        MonitoringTimeInterval fromDb = opt.get();
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);

        validate(fromDb);

        return repository.save(fromDb);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    public boolean hasClashesWithOtherIntervals(MonitoringTimeInterval m) {
        List<MonitoringTimeInterval> clientIntervals = repository.findByClientId(m.getClient().getId());
        List<MonitoringTimeInterval> workerIntervals = repository.findByWorkerId(m.getWorker().getId());
        return hasClashes(m, clientIntervals) || hasClashes(m, workerIntervals);
    }

    public void validate(MonitoringTimeInterval m) {
        if (hasClashesWithOtherIntervals(m))
            throw new TimeIntervalClashException("Interval clashes with some other interval of client or worker");
        if (!m.getBegin().before(m.getEnding()))
            throw new ResourceException(HttpStatus.BAD_REQUEST, "Begin must be before ending");
        if (m.getWorker().getRole() != WorkerRole.SURVEILLANCE_OFFICER)
            throw new IllegalArgumentException("Time interval can be related only to surveillance officer");
    }

    public boolean hasClashes(MonitoringTimeInterval m, List<MonitoringTimeInterval> intervals) {
        for (MonitoringTimeInterval interval : intervals) {
            if (Objects.equals(interval.getId(), m.getId()))
                continue;
            if (interval.getWeekday() == m.getWeekday() && !(
                    interval.getBegin().after(m.getEnding()) ||
                    interval.getEnding().before(m.getBegin()))) {
                return true;
            }
        }
        return false;
    }

    public Set<Client> getWorkerRelatedClients(Worker w) {
        List<MonitoringTimeInterval> ts = repository.findByWorkerId(w.getId());
        Set<Client> result = new HashSet<>();
        for (MonitoringTimeInterval t : ts)
            result.add(t.getClient());
        return result;
    }
}
