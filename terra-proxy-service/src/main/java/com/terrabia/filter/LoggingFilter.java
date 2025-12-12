package com.terrabia.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

@Component
public class LoggingFilter extends AbstractGatewayFilterFactory<LoggingFilter.Config> {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingFilter.class);
    
    public LoggingFilter() {
        super(Config.class);
    }
    
    public static class Config {
        // Configuration properties if needed
    }
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            Instant startTime = Instant.now();
            ServerHttpRequest request = exchange.getRequest();
            
            // Log request details
            logger.info("=== Gateway Request ===");
            logger.info("Method: {}", request.getMethod());
            logger.info("Path: {}", request.getPath());
            logger.info("URI: {}", request.getURI());
            
            // Solution: Créer les variables finales ou effectivement finales pour la lambda
            final String requestId = generateOrGetRequestId(request);
            final long requestTimestamp = System.currentTimeMillis();
            
            // Ajouter les en-têtes une seule fois
            ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-Request-Timestamp", String.valueOf(requestTimestamp))
                .header("X-Gateway-Request-ID", requestId)
                .build();
            
            return chain.filter(exchange.mutate().request(modifiedRequest).build())
                .then(Mono.fromRunnable(() -> {
                    Instant endTime = Instant.now();
                    Duration duration = Duration.between(startTime, endTime);
                    
                    logger.info("=== Gateway Response ===");
                    logger.info("Request ID: {}", requestId); // Ici, requestId est effectivement final
                    logger.info("Duration: {} ms", duration.toMillis());
                    logger.info("Status: {}", exchange.getResponse().getStatusCode());
                }));
        };
    }
    
    // Méthode extraite pour garantir que requestId est final pour la lambda
    private String generateOrGetRequestId(ServerHttpRequest request) {
        String requestId = request.getHeaders().getFirst("X-Request-ID");
        if (requestId == null || requestId.isEmpty()) {
            requestId = java.util.UUID.randomUUID().toString();
        }
        return requestId;
    }
}