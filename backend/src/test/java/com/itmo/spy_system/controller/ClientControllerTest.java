package com.itmo.spy_system.controller;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


class ClientControllerTest extends BaseApiTest {

    @Test
    void getClients() throws Exception {
        mockMvc.perform(get("/api/clients")
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").exists());

        mockMvc.perform(get("/api/clients")
                        .with(clientAuth()))
                .andExpect(status().isForbidden());
    }

    @Test
    void getClientById() throws Exception {
        mockMvc.perform(get("/api/clients/{id}", clientA.getId())
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(clientA.getId()))
                .andExpect(jsonPath("$.name").value("Client A"))
                .andExpect(jsonPath("$.email").value("a@mail.com"))
                .andExpect(jsonPath("$.metricThreshold").exists());
    }

    @Test
    void getMetricByClientId() throws Exception {
        mockMvc.perform(get("/api/clients/{id}/metrics/latest", clientA.getId())
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.clientId").value(clientA.getId()))
                .andExpect(jsonPath("$.value").exists());
    }

    @Test
    void getClientById_notFound() throws Exception {
        mockMvc.perform(get("/api/clients/{id}", 999L)
                        .with(managerAuth()))
                .andExpect(status().isNotFound());
    }

    @Test
    void createClient_asUnauthorized_created() throws Exception {
        mockMvc.perform(post("/api/clients")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                    {
                      "email":"test@test.test",
                      "password":"123456",
                      "name":"test",
                      "surname":"test",
                      "lastname":"test",
                      "metricThreshold":100,
                      "violationsCount":0
                    }
                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("test"));
    }

    @Test
    void updateClientMetricThreshold() throws Exception {
        int newMetricThresholdValue = 10;
        mockMvc.perform(patch("/api/clients/{id}", client.getId())
                        .with(managerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"metricThreshold\":%d}", newMetricThresholdValue)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(client.getEmail()))
                .andExpect(jsonPath("$.metricThreshold").value(newMetricThresholdValue));
    }

    @Test
    void updateClient_notFound() throws Exception {
        mockMvc.perform(put("/api/clients/{id}", 999L)
                        .with(managerAuth())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                    {
                      "name": "X",
                      "email": "x@mail.com"
                    }
                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteClient_asClient_forbidden() throws Exception {
        mockMvc.perform(delete("/api/clients/{id}", clientA.getId())
                        .with(clientAuth()))
                .andExpect(status().isForbidden());
    }

    @Test
    void getClients_unauthorized() throws Exception {
        mockMvc.perform(get("/api/clients"))
                .andExpect(status().isUnauthorized());
    }
}
