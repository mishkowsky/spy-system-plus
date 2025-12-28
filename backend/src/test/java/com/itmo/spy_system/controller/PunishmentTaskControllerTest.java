package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.PunishmentTask;
import com.itmo.spy_system.entity.TaskStatus;
import com.itmo.spy_system.service.PunishmentTaskService;
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

public class PunishmentTaskControllerTest extends BaseApiTest {

    @Test
    public void patchPunishmentTask() throws Exception {
        mockMvc.perform(patch("/api/punishment_tasks/{1}", punishmentTask.getId()).with(workerAuth())
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("""
                        {"status":"%s"}
                        """, TaskStatus.DONE)))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.status").value(TaskStatus.DONE.toString()));
    }
}
