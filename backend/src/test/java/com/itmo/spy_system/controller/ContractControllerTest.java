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

public class ContractControllerTest extends BaseApiTest {

    @MockBean
    private ContractService service;

    @Test
    public void getAllContracts() throws Exception {
//        Mockito.when(service.findAll()).thenReturn(Collections.emptyList());
        mockMvc.perform(get("/api/contracts/filtered?signerId={id}", manager.getId())
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(contract.getId()));
    }

    @Test
    public void testCreateContract() throws Exception {
        Contract entity = new Contract();
        entity.setId(1L);
        Mockito.when(service.save(Mockito.any())).thenReturn(entity);
        mockMvc.perform(post("/api/contracts")
                        .with(clientAuth())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                            
                        }
                        """))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.id").value(1));
    }
}
