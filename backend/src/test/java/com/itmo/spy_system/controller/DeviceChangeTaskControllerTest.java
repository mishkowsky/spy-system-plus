package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.TaskStatus;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class DeviceChangeTaskControllerTest extends BaseApiTest {

    @Test
    public void patchDeviceChangeTask() throws Exception {
        mockMvc.perform(patch("/api/device_change_tasks/{1}", deviceChangeTask.getId()).with(workerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                        {"status":"%s"}
                        """, TaskStatus.DONE)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(TaskStatus.DONE.toString()));
    }
}
