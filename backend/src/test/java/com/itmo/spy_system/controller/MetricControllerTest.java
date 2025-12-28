package com.itmo.spy_system.controller;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.itmo.spy_system.entity.Metric;
import com.itmo.spy_system.entity.NotificationType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class MetricControllerTest extends BaseApiTest {
    @Autowired
    protected ObjectMapper objectMapper;

    @Test
    void getMetricsByClientId() throws Exception {
        mockMvc.perform(get("/api/metrics/filtered?clientId={id}", clientA.getId())
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].value").exists());
    }

    @Test
    void postDeviceMetric() throws Exception {
        mockMvc.perform(post("/api/metrics?chargeLevel=100")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                        {"deviceId": %d,
                        "value": 10,
                        "timestamp": "1970-01-01T00:00:00",
                        "latitude": 1,
                        "longitude": 1}
                        """, assignedDevice.getDeviceId())
                ))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceId").value(assignedDevice.getDeviceId()));
    }

    @Test
    void postMetricOverThreshold() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/metrics?chargeLevel=100")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                        {"deviceId": %d,
                        "value": %d,
                        "timestamp": "1970-01-01T00:00:00",
                        "latitude": 1,
                        "longitude": 1}
                        """, assignedDevice.getDeviceId(), client.getMetricThreshold() + 1)
                        ))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceId").value(assignedDevice.getDeviceId())).andReturn();

        String json = result.getResponse().getContentAsString();
        Metric metric = objectMapper.readValue(json, Metric.class);

        mockMvc.perform(get("/api/punishment_tasks").with(workerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].client.id").value(client.getId()))
                .andExpect(jsonPath("$[1].triggeredMetricId").value(metric.getId()));

        mockMvc.perform(get("/api/notifications").with(workerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].type").value(NotificationType.PUNISHMENT_TASK_CREATION.toString()));

    }
}
