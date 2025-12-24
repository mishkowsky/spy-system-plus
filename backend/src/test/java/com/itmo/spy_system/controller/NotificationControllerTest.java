package com.itmo.spy_system.controller;

import com.fasterxml.jackson.databind.ser.Serializers;
import com.itmo.spy_system.entity.Notification;
import com.itmo.spy_system.service.NotificationService;
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

public class NotificationControllerTest extends BaseApiTest {

    @MockBean
    private NotificationService service;

    @Test
    public void testGetAllNotifications() throws Exception {
        Mockito.when(service.findAll()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/notifications").with(managerAuth()))
               .andExpect(status().isOk())
               .andExpect(content().json("[]"));
    }

    @Test
    public void testCreateNotification() throws Exception {
        Notification entity = new Notification();
        entity.setId(1L);
        Mockito.when(service.save(Mockito.any())).thenReturn(entity);
        mockMvc.perform(post("/notifications")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{{}}"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.id").value(1));
    }
}
