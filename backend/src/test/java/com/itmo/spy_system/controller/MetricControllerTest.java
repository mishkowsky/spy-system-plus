package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Metric;
import com.itmo.spy_system.service.MetricService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MetricController.class)
public class MetricControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MetricService service;

    @Test
    public void testGetAllMetrics() throws Exception {
        Mockito.when(service.findAll()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/metrics"))
               .andExpect(status().isOk())
               .andExpect(content().json("[]"));
    }

    @Test
    public void testCreateMetric() throws Exception {
        Metric entity = new Metric();
        entity.setId(1L);
        Mockito.when(service.create(Mockito.any())).thenReturn(entity);
        mockMvc.perform(post("/metrics")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{{}}"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.id").value(1));
    }
}
