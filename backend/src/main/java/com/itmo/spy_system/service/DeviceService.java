package com.itmo.spy_system.service;

import com.itmo.spy_system.entity.Device;
import com.itmo.spy_system.entity.DeviceAssignmentStatus;
import com.itmo.spy_system.entity.Metric;
import com.itmo.spy_system.repository.DeviceRepository;
import com.itmo.spy_system.repository.ManagerRepository;
import com.itmo.spy_system.repository.MetricRepository;
import com.itmo.spy_system.utils.NullAwareBeanUtilsBean;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@AllArgsConstructor
public class DeviceService {
    private final DeviceRepository repository;
    private final MetricRepository metricRepository;

    public List<Device> findAll() {
        return repository.findAll();
    }

    public Optional<Device> findById(Long id) {
        return repository.findById(id);
    }

    public List<Device> findByClientId(Long clientId) { return repository.findByAssignedClientId(clientId); }

    public Optional<Metric> getLatestDeviceMetric(Long id) {
        return metricRepository.findTopByDeviceIdOrderByTimestampDesc(id);
    }

    public Device save(Device entity) {
        return repository.save(entity);
    }

    public Device patch(Map<String, Object> fieldsToPatch, Device toBePatched) {
        Device fromDb = repository.findById(toBePatched.getDeviceId()).get();
        if (fromDb.getAssignedClientId() == null && toBePatched.getAssignedClientId() != null && toBePatched.getAssignmentStatus() == null)
            fromDb.setAssignmentStatus(DeviceAssignmentStatus.ASSIGNED);
//        for (Map.Entry<String, Object> entry : fieldsToPatch.entrySet()) {
//            Device d = new Device();
        String[] fieldNames = new String[fromDb.getClass().getDeclaredFields().length] ;
        int i = 0;
        for (Field f : fromDb.getClass().getDeclaredFields()) {
            if (!fieldsToPatch.containsKey(f.getName())) {
                fieldNames[i++] = f.getName();
            }
        }
        BeanUtils.copyProperties(toBePatched, fromDb, fieldNames);
//                Field field = fromDb.getClass().getDeclaredField(entry.getKey());
//                field.set(fromDb, entry.getValue());

//        }
//        NullAwareBeanUtilsBean.copyNonNullProperties(toBePatched, fromDb);
        return repository.save(fromDb);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
