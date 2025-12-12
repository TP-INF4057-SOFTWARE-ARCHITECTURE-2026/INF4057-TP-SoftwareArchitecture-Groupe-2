package com.terrabia.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {
    
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> health() {
        return Mono.fromCallable(() -> {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "UP");
            response.put("service", "terra-proxy-service");
            response.put("timestamp", System.currentTimeMillis());
            response.put("version", "1.0.0");
            
            return ResponseEntity.ok(response);
        });
    }
    
    @GetMapping("/info")
    public Mono<ResponseEntity<Map<String, Object>>> info() {
        return Mono.fromCallable(() -> {
            Map<String, Object> response = new HashMap<>();
            response.put("name", "Terrabia API Gateway");
            response.put("description", "Spring Cloud Gateway for Terrabia Microservices");
            response.put("version", "1.0.0");
            response.put("author", "Terrabia Team");
            
            return ResponseEntity.ok(response);
        });
    }
    
    @GetMapping("/routes")
    public Mono<ResponseEntity<Map<String, Object>>> routes() {
        return Mono.fromCallable(() -> {
            Map<String, Object> response = new HashMap<>();
            
            Map<String, Object> routes = new HashMap<>();
            routes.put("auth", "/api/auth/** → terra-auth-service");
            routes.put("users", "/api/users/** → terra-users-service");
            routes.put("products", "/api/products/** → terra-product-service");
            routes.put("orders", "/api/orders/** → terra-order-transaction-service");
            routes.put("notifications", "/api/notifications/** → terra-notification-service");
            
            response.put("routes", routes);
            response.put("count", routes.size());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        });
    }
}