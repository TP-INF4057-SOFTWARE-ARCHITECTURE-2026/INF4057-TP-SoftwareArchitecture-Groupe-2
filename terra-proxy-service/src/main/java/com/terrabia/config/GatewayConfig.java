package com.terrabia.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class GatewayConfig {
    
    // ============ FILTRE CORS GLOBAL ============
    @Bean
    public CorsWebFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        // Origines autorisées pour le développement et la production
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedOrigin("http://127.0.0.1:5173");
        config.addAllowedOrigin("http://localhost:80");
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");
        // Headers autorisés
        config.addAllowedHeader("*");
        config.addExposedHeader("*");
        // Méthodes HTTP autorisées
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("PATCH");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");
        config.addAllowedMethod("HEAD");
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsWebFilter(source);
    }
    
    // ============ CONFIGURATION DES ROUTES ============
    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            // Route pour les endpoints du Gateway (optionnel - enlevez si non nécessaire)
            .route("gateway-health", r -> r
                .path("/api/health", "/api/info", "/api/routes", "/actuator/**", "/health")
                .uri("http://127.0.0.1:8082"))
            
            // Terra Auth Service
            .route("terra-auth-service", r -> r
                .path("/api/auth/**")
                .filters(f -> f
                    .rewritePath("/api/auth/(?<path>.*)", "/api/${path}")
                    .dedupeResponseHeader("Access-Control-Allow-Origin", "RETAIN_UNIQUE")
                    .dedupeResponseHeader("Access-Control-Allow-Credentials", "RETAIN_UNIQUE")
                )
                .uri("lb://TERRA-AUTH-SERVICE"))
            
            // Terra Users Service
            .route("terra-users-service", r -> r
                .path("/api/users/**")
                .filters(f -> f
                    .rewritePath("/api/users/(?<path>.*)", "/api/${path}")
                    .dedupeResponseHeader("Access-Control-Allow-Origin", "RETAIN_UNIQUE")
                )
                .uri("lb://TERRA-USERS-SERVICE"))
            
            // Terra Product Service
            .route("terra-product-service", r -> r
                .path("/api/products/**")
                .filters(f -> f
                    .rewritePath("/api/products/(?<path>.*)", "/api/${path}")
                    .dedupeResponseHeader("Access-Control-Allow-Origin", "RETAIN_UNIQUE")
                )
                .uri("lb://TERRA-PRODUCT-SERVICE"))
            
            // Terra Order Service
            .route("terra-order-transaction-service", r -> r
                .path("/api/orders/**")
                .filters(f -> f
                    .rewritePath("/api/orders/(?<path>.*)", "/api/${path}")
                    .dedupeResponseHeader("Access-Control-Allow-Origin", "RETAIN_UNIQUE")
                )
                .uri("lb://TERRA-ORDER-TRANSACTION-SERVICE"))
            
            // Terra Notification Service
            .route("terra-notification-service", r -> r
                .path("/api/notifications/**")
                .filters(f -> f
                    .rewritePath("/api/notifications/(?<path>.*)", "/api/${path}")
                    .dedupeResponseHeader("Access-Control-Allow-Origin", "RETAIN_UNIQUE")
                )
                .uri("lb://TERRA-NOTIFICATION-SERVICE"))
            
            .build();
    }
}
