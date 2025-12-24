package com.itmo.spy_system.controller;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class AuthControllerTest extends BaseApiTest {
    @Test
    void client_auth_test() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .with(clientAuth())
                        .content(String.format("""
                    {
                      "username": %s,
                      "password": %s
                    }
                """, clientUsername, clientPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").exists());
    }
}
