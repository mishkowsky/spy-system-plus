package com.itmo.spy_system.controller;


import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class MetricControllerTest extends BaseApiTest {

    @Test
    void getMetricsByClientId() throws Exception {
        mockMvc.perform(get("/api/metrics/filtered?clientId={id}", clientA.getId())
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].value").exists());
    }
}
