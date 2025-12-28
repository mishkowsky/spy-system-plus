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

    @Test
    public void getContracts() throws Exception {
        mockMvc.perform(get("/api/contracts/filtered?signerId={id}", manager.getId())
                        .with(managerAuth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(contract.getId()));
    }
}
