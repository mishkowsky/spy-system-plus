package com.itmo.spy_system.controller;

import com.itmo.spy_system.dto.MonitoringTimeIntervalDTO;
import com.itmo.spy_system.dto.MonitoringTimeIntervalMapper;
import com.itmo.spy_system.entity.MonitoringTimeInterval;
import com.itmo.spy_system.service.MonitoringService;
import com.itmo.spy_system.utils.TimeIntervalClashException;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/monitoring_time_intervals")
@RequiredArgsConstructor
public class MonitoringTimeIntervalController extends BaseExceptionHandler {

    private final MonitoringService service;
    private final MonitoringTimeIntervalMapper mapper;

    @Secured({"manager", "worker"})
    @GetMapping
    public List<MonitoringTimeInterval> getAll() {
        return service.getAll();
    }

    @Secured({"manager"})
    @PostMapping
    public MonitoringTimeIntervalDTO create(@RequestBody MonitoringTimeIntervalDTO dto)  {
        MonitoringTimeInterval m = mapper.toEntity(dto);
        return mapper.toDto(service.create(m));
    }

    @Secured({"manager"})
    @PatchMapping("/{id}")
    public MonitoringTimeInterval patch(@PathVariable Long id, @RequestBody Map<String, Object> entity) {
        entity.put("id", id);
        return service.patch(entity);
    }

    @Getter
    @AllArgsConstructor
    public static class ResponseWithMessage {
        private final String message;
    }

    @Secured({"manager"})
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseWithMessage> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok(new ResponseWithMessage("ok"));
    }

    @ExceptionHandler(TimeIntervalClashException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public String handleTimeIntervalClashException(TimeIntervalClashException ex) {
        return ex.getMessage();
    }
}
