package com.itmo.spy_system.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


public class DeviceControllerTest extends BaseApiTest {

    @Test
    void getDevicesByClientId() throws Exception {
        mockMvc.perform(get("/api/devices/filtered?assignedClientId={id}", client.getId())
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].deviceId").value(1));
    }

    @Test
    void patchAssignedClient() throws Exception {
        mockMvc.perform(patch("/api/devices/{id}", assignedDevice.getDeviceId())
                        .with(managerAuth())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"assignedClientId":null,"assignmentStatus":"UNASSIGNED"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedClientId").isEmpty());

        mockMvc.perform(patch("/api/devices/{id}", assignedDevice.getDeviceId())
                        .with(managerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                        {"assignedClientId":%d,"assignmentStatus":"ASSIGNED"}
                        """, client.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedClientId").value(client.getId()));
    }
}
