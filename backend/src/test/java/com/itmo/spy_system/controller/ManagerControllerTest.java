package com.itmo.spy_system.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class ManagerControllerTest extends BaseApiTest {
    @Test
    void createManagers() throws Exception {
        mockMvc.perform(post("/api/managers")
                        .with(seniorManagerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                    {
                        "email": "test@test.test",
                        "name": "test",
                        "surname": "test",
                        "lastname": "test",
                        "isSenior": "false"
                    }
                """, clientUsername, clientPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@test.test"))
                .andExpect(jsonPath("$.isSenior").value("false"));

        mockMvc.perform(post("/api/managers")
                        .with(seniorManagerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                    {
                        "email": "test2@test.test",
                        "name": "test",
                        "surname": "test",
                        "lastname": "test",
                        "isSenior": "true"
                    }
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test2@test.test"))
                .andExpect(jsonPath("$.isSenior").value("true"));;
    }
}