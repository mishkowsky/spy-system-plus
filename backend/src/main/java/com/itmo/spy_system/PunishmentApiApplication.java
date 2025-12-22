package com.itmo.spy_system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class PunishmentApiApplication {
    public static void main(String[] args) {
        System.out.println(System.getenv("HELLO"));
        SpringApplication.run(PunishmentApiApplication.class, args);
    }

//    @Bean
//    public WebMvcConfigurer corsConfigurer() {
//        return new WebMvcConfigurer() {
//            @Override
//            public void addCorsMappings(CorsRegistry registry) {
//                registry.addMapping("/**") // Apply to all endpoints
//                        .allowedOrigins("*") // Allow all origins
//                        .allowedMethods("*") // Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
//                        .allowedHeaders("*") // Allow all headers
//                        .allowCredentials(false) // Whether to allow sending credentials like cookies
//                        .maxAge(3600); // Max age of pre-flight requests in seconds
//            }
//        };
//    }
}
