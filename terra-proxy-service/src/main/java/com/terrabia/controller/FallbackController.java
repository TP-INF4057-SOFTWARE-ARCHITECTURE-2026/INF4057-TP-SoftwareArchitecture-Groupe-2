package com.terrabia.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/fallback")
public class FallbackController {
    
    @GetMapping("/auth")
    public Mono<ResponseEntity<Map<String, Object>>> authFallback() {
        return createFallbackResponse(
            "SERVICE_UNAVAILABLE", 
            "Authentication service is temporarily unavailable",
            "terra-auth-service",
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
    
    @GetMapping("/users")
    public Mono<ResponseEntity<Map<String, Object>>> usersFallback() {
        return createFallbackResponse(
            "SERVICE_UNAVAILABLE",
            "Users service is temporarily unavailable", 
            "terra-users-service",
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
    
    @GetMapping("/products")
    public Mono<ResponseEntity<Map<String, Object>>> productsFallback() {
        return createFallbackResponse(
            "SERVICE_UNAVAILABLE",
            "Products service is temporarily unavailable",
            "terra-product-service", 
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
    
    @GetMapping("/orders")
    public Mono<ResponseEntity<Map<String, Object>>> ordersFallback() {
        return createFallbackResponse(
            "SERVICE_UNAVAILABLE",
            "Orders service is temporarily unavailable",
            "terra-order-transaction-service",
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
    
    @GetMapping("/notifications")
    public Mono<ResponseEntity<Map<String, Object>>> notificationsFallback() {
        return createFallbackResponse(
            "SERVICE_UNAVAILABLE",
            "Notifications service is temporarily unavailable",
            "terra-notification-service",
            HttpStatus.SERVICE_UNAVAILABLE
        );
    }
    
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> fallbackHealth() {
        return Mono.fromCallable(() -> {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "UP");
            response.put("service", "fallback-controller");
            response.put("message", "Fallback endpoints are available");
            
            return ResponseEntity.ok(response);
        });
    }
    
    private Mono<ResponseEntity<Map<String, Object>>> createFallbackResponse(
            String status, 
            String message, 
            String service,
            HttpStatus httpStatus) {
        
        return Mono.fromCallable(() -> {
            Map<String, Object> response = new HashMap<>();
            response.put("status", status);
            response.put("message", message);
            response.put("service", service);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(httpStatus).body(response);
        });
    }
}