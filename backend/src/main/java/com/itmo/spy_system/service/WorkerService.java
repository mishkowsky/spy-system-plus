
package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.*;
import com.itmo.spy_system.repository.MonitoringTimeIntervalRepository;
import com.itmo.spy_system.repository.PunishmentTaskRepository;
import com.itmo.spy_system.repository.TimeIntervalRepository;
import com.itmo.spy_system.repository.WorkerRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import java.sql.Time;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WorkerService {
    private final WorkerRepository workerRepository;
    private final PunishmentTaskRepository punishmentTaskRepository;
    private final MonitoringTimeIntervalRepository monitoringTimeIntervalRepository;
    private final TimeIntervalRepository timeIntervalRepository;

    private final PasswordEncoder passwordEncoder;

    public List<Worker> findAll() {
        return workerRepository.findAll();
    }

    public Optional<Worker> findById(Long id) {
        return workerRepository.findById(id);
    }

    public Worker save(Worker worker) {
        if (worker.getPassword() != null) {
            worker.setPassword(passwordEncoder.encode(worker.getPassword()));
        }
        return workerRepository.save(worker);
    }

    public Worker patch(Worker toBePatched) {
        if (toBePatched.getPassword() != null) {
            toBePatched.setPassword(passwordEncoder.encode(toBePatched.getPassword()));
        }
        Worker fromDb = workerRepository.findById(toBePatched.getId()).get();
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        if (toBePatched.getManager() == null) fromDb.setManager(null);
        return workerRepository.save(fromDb);
    }

    public void deleteById(Long id) {
        workerRepository.deleteById(id);
    }

    public boolean hasMonitoringTimeIntervals(Long id) {
        return !(monitoringTimeIntervalRepository.findByWorkerId(id).isEmpty());
    }

    public Worker findMostFreeCorrectionsOfficer() {
        List<Worker> correctionsOfficers = workerRepository.findByRole(WorkerRole.CORRECTIONS_OFFICER);

        LocalDateTime now = LocalDateTime.now();
        Weekday today = Weekday.valueOf(now.getDayOfWeek().name().toUpperCase());
        Time currentTime = Time.valueOf(now.toLocalTime());

        List<Worker> workingNow = new ArrayList<>();

        // TODO throw new NoWorkersFoundException("No workers were found");
        Worker mostSuiteableWorker = correctionsOfficers.get(0);

        for (Worker w : correctionsOfficers) {
            List<TimeInterval> intervals = timeIntervalRepository.findByWorkerIdAndWeekday(w.getId(), today);
            boolean isWorkingNow = intervals.stream().anyMatch(t ->
                    !(currentTime.before(t.getBegin()) || currentTime.after(t.getEnding())));
            if (isWorkingNow) {
                workingNow.add(w);
            }
        }
        if (workingNow.isEmpty()) {
            TimeInterval nearestInterval = null;
            Worker nearestWorker = mostSuiteableWorker;

            for (Worker w : correctionsOfficers) {
                List<TimeInterval> intervals = timeIntervalRepository.findByWorkerId(w.getId());
                for (TimeInterval t : intervals) {
                    if (nearestInterval == null) {
                        nearestInterval = t;
                        nearestWorker = w;
                    }
                    if (Weekday.getWeekdayDifference(today, t.getWeekday()) <=
                            Weekday.getWeekdayDifference(today, nearestInterval.getWeekday())) {
                        if (t.getBegin().before(nearestInterval.getBegin())) {
                            nearestInterval = t;
                            nearestWorker = w;
                        }
                    }
                }
            }
            mostSuiteableWorker = nearestWorker;
        } else {
            long leastTaskCount = Long.MAX_VALUE;
            for (Worker w : workingNow) {
                long taskCount = punishmentTaskRepository
                        .findByExecutionerIdAndStatusIn(w.getId(), List.of(TaskStatus.NEW, TaskStatus.IN_PROGRESS))
                        .size();
                if (taskCount < leastTaskCount) {
                    mostSuiteableWorker = w;
                    leastTaskCount = taskCount;
                }
            }
        }
        return mostSuiteableWorker;
    }
}
