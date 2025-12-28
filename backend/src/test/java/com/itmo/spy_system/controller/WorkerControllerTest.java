package com.itmo.spy_system.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class WorkerControllerTest extends BaseApiTest {
    @Test
    void createWorkers() throws Exception {
        mockMvc.perform(post("/api/workers")
                        .with(managerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                    {
                        "email": "test@test.test",
                        "name":"test",
                        "surname":"test",
                        "lastname":"test",
                        "role":"CORRECTIONS_OFFICER"
                    }
                """, clientUsername, clientPassword)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/workers")
                        .with(managerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                    {
                        "email": "test1@test.test",
                        "name":"test",
                        "surname":"test",
                        "lastname":"test",
                        "role":"SURVEILLANCE_OFFICER"
                    }
                """, clientUsername, clientPassword)))
                .andExpect(status().isOk());
    }
}