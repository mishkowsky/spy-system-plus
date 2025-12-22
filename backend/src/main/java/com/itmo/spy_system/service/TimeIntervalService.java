package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.Client;
import com.itmo.spy_system.entity.TimeInterval;
import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.repository.TimeIntervalRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TimeIntervalService {
    private final TimeIntervalRepository repository;

    public List<TimeInterval> findAll() {
        return repository.findAll();
    }

    public Optional<TimeInterval> findById(Long id) {
        return repository.findById(id);
    }

    public TimeInterval save(TimeInterval entity) {
        validateTimeInterval(entity);
        return repository.save(entity);
    }

    public TimeInterval patch(TimeInterval toBePatched) {
        TimeInterval fromDb = repository.findById(toBePatched.getId()).get();
        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        validateTimeInterval(fromDb);
        return repository.save(fromDb);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    private void validateTimeInterval(TimeInterval interval) {
//        if (interval.getBegin().compareTo(interval.getEnding()) >= 0) {
        if (interval.getBegin().after(interval.getEnding())) {
            throw new IllegalArgumentException("Begin time must be before end time.");
        }

        Long ownerId = interval.getWorkerId() != null ? interval.getWorkerId() : interval.getManagerId();
        if (ownerId == null) {
            throw new IllegalArgumentException("Either workerId or managerId must be set.");
        }

        List<TimeInterval> sameDayIntervals = (interval.getWorkerId() != null)
                ? repository.findByWorkerIdAndWeekday(interval.getWorkerId(), interval.getWeekday())
                : repository.findByManagerIdAndWeekday(interval.getManagerId(), interval.getWeekday());

        for (TimeInterval existing : sameDayIntervals) {
            if (interval.getId() != null && interval.getId().equals(existing.getId())) continue;

//            boolean overlap =
//                    !(interval.getEnding().compareTo(existing.getBegin()) < 0 ||
//                            interval.getBegin().compareTo(existing.getEnding()) >= 0);

            boolean overlap = !(                                        // negate
                    interval.getEnding().before(existing.getBegin()) || // ends before existing begins
                            interval.getBegin().after(existing.getEnding())     // starts after existing begins
            );

            if (overlap) {
                throw new IllegalArgumentException("TimeInterval overlaps with existing one on the same weekday.");
            }
        }
    }
}
