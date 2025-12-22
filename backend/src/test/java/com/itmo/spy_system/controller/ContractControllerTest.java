package com.itmo.spy_system.controller;

import com.itmo.spy_system.entity.Contract;
import com.itmo.spy_system.service.ContractService;
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

@WebMvcTest(ContractController.class)
public class ContractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ContractService service;

    @Test
    public void testGetAllContracts() throws Exception {
        Mockito.when(service.findAll()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/contracts"))
               .andExpect(status().isOk())
               .andExpect(content().json("[]"));
    }

    @Test
    public void testCreateContract() throws Exception {
        Contract entity = new Contract();
        entity.setId(1L);
        Mockito.when(service.save(Mockito.any())).thenReturn(entity);
        mockMvc.perform(post("/contracts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{{}}"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.id").value(1));
    }
}
