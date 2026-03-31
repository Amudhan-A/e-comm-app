package com.ecom.api_gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.Date;
import java.util.List;

/**
 * JwtAuthFilter is a Global Gateway Filter that intercepts every request
 * and performs JWT validation for protected routes.
 *
 * Flow:
 *   1. Check if the route is public (auth endpoints, swagger, product listing) → skip
 *   2. Extract the "accessToken" HttpOnly cookie
 *   3. Parse and validate the JWT using the shared secret
 *   4. Extract userId (subject/email) and role from claims
 *   5. Inject X-User-Id and X-User-Role headers into the downstream request
 *   6. If token is missing/invalid/expired → return 401 Unauthorized
 *
 * This filter runs on EVERY request. The Gateway is WebFlux-based (reactive),
 * so we use GlobalFilter (not servlet OncePerRequestFilter).
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Paths that do NOT require authentication.
     * Auth endpoints must be open — otherwise users can't log in.
     * Product listing is public — unauthenticated browsing is allowed.
     * Swagger endpoints are for development.
     */
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/products",
            "/swagger-ui",
            "/api-docs"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Skip authentication for public paths
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // Extract JWT from "accessToken" HttpOnly cookie
        String token = extractTokenFromCookie(exchange, "accessToken");

        if (token == null) {
            return unauthorizedResponse(exchange, "Missing access token");
        }

        // Validate token and extract claims
        Claims claims;
        try {
            claims = extractAllClaims(token);
        } catch (Exception e) {
            return unauthorizedResponse(exchange, "Invalid or expired token");
        }

        // Check expiration
        if (claims.getExpiration().before(new Date())) {
            return unauthorizedResponse(exchange, "Token has expired");
        }

        // Extract user info from claims
        String userEmail = claims.getSubject();
        String role = claims.get("role", String.class);

        // Inject user context headers into the downstream request
        // These headers are what cart-service, order-service, etc. read
        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", userEmail)
                .header("X-User-Role", role != null ? role : "ROLE_CUSTOMER")
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    /**
     * High priority — this filter must run BEFORE routing.
     * Lower number = higher priority.
     */
    @Override
    public int getOrder() {
        return -1;
    }

    /**
     * Check if the request path is public (no auth required).
     * Uses startsWith so /api/products, /api/products/123, etc. all match.
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }

    /**
     * Extract a cookie value from the reactive ServerWebExchange.
     * Spring WebFlux uses HttpCookie (not jakarta.servlet.http.Cookie).
     */
    private String extractTokenFromCookie(ServerWebExchange exchange, String cookieName) {
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst(cookieName);
        return cookie != null ? cookie.getValue() : null;
    }

    /**
     * Parse the JWT and verify its signature using the shared secret.
     * Throws an exception if the token is tampered with or malformed.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Convert the Base64-encoded secret from application.properties
     * into a cryptographic Key object for HMAC-SHA256 verification.
     * Same logic as auth-service's JwtService.getSigningKey().
     */
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Return a 401 Unauthorized response with the connection closed.
     * No response body — the status code is sufficient for the frontend.
     */
    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String reason) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("X-Auth-Error", reason);
        return exchange.getResponse().setComplete();
    }
}
