package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Worker;
import com.itmo.spy_system.service.WorkerService;
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

@WebMvcTest(WorkerController.class)
public class WorkerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WorkerService service;

    @Test
    public void testGetAllWorkers() throws Exception {
        Mockito.when(service.findAll()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/workers"))
               .andExpect(status().isOk())
               .andExpect(content().json("[]"));
    }

    @Test
    public void testCreateWorker() throws Exception {
        Worker entity = new Worker();
        entity.setId(1L);
        Mockito.when(service.save(Mockito.any())).thenReturn(entity);
        mockMvc.perform(post("/workers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{{}}"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.id").value(1));
    }
}
