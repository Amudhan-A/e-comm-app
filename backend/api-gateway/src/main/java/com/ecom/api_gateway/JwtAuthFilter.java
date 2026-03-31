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
import org.springframework.http.HttpMethod;
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
 * and performs JWT validation + Role-Based Access Control (RBAC).
 *
 * Security model:
 *   - Public routes: no token needed (auth endpoints, GET products, swagger)
 *   - Authenticated routes: valid JWT required (cart, orders, profile)
 *   - Admin-only routes: valid JWT + ROLE_ADMIN required (product create/update/delete)
 *
 * Flow:
 *   1. Check if the route is fully public → pass through
 *   2. Extract the "accessToken" HttpOnly cookie
 *   3. Parse and validate the JWT using the shared secret
 *   4. Check if the route requires ADMIN role → enforce it
 *   5. Inject X-User-Id and X-User-Role headers into the downstream request
 *   6. If token is missing/invalid/expired → 401 Unauthorized
 *   7. If role is insufficient → 403 Forbidden
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Fully public paths — no authentication required at all.
     * These are matched with startsWith, so /api/auth/register, /swagger-ui/index.html, etc. all work.
     */
    private static final List<String> OPEN_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/swagger-ui",
            "/api-docs"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // ── Fully open paths (no token needed) ───────────────────────────────
        if (isOpenPath(path)) {
            return chain.filter(exchange);
        }

        // ── GET /api/products is public (browsing without login) ─────────────
        // But POST/PUT/DELETE /api/products requires ADMIN (handled below after JWT parse)
        if (method == HttpMethod.GET && path.startsWith("/api/products")) {
            return chain.filter(exchange);
        }

        // ── Everything below requires a valid JWT ────────────────────────────

        String token = extractTokenFromCookie(exchange, "accessToken");

        if (token == null) {
            return unauthorizedResponse(exchange, "Missing access token");
        }

        Claims claims;
        try {
            claims = extractAllClaims(token);
        } catch (Exception e) {
            return unauthorizedResponse(exchange, "Invalid or expired token");
        }

        if (claims.getExpiration().before(new Date())) {
            return unauthorizedResponse(exchange, "Token has expired");
        }

        String userEmail = claims.getSubject();
        String role = claims.get("role", String.class);
        if (role == null) {
            role = "ROLE_CUSTOMER";
        }

        // ── Admin-only routes: product mutations + order status updates ───────
        if (isAdminOnly(path, method) && !"ROLE_ADMIN".equals(role)) {
            return forbiddenResponse(exchange, "Admin access required");
        }

        // ── Inject user identity headers for downstream services ─────────────
        ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", userEmail)
                .header("X-User-Role", role)
                .build();

        return chain.filter(exchange.mutate().request(mutatedRequest).build());
    }

    @Override
    public int getOrder() {
        return -1;
    }

    /**
     * Check if the path is fully open (no auth at all).
     */
    private boolean isOpenPath(String path) {
        return OPEN_PATHS.stream().anyMatch(path::startsWith);
    }

    /**
     * Check if this path + method combination requires ADMIN role.
     *
     * Admin-only operations:
     *   - POST, PUT, DELETE on /api/products (create, update, soft-delete products)
     *   - PATCH /api/products/{id}/stock (internal, but guard it anyway)
     *   - PATCH /api/orders/{id}/status (admin status updates)
     */
    private boolean isAdminOnly(String path, HttpMethod method) {
        // Product write operations: POST, PUT, DELETE, PATCH on /api/products
        if (path.startsWith("/api/products") && method != HttpMethod.GET) {
            return true;
        }

        // Order status update: PATCH /api/orders/.../status
        if (path.startsWith("/api/orders") && path.endsWith("/status") && method == HttpMethod.PATCH) {
            return true;
        }

        return false;
    }

    private String extractTokenFromCookie(ServerWebExchange exchange, String cookieName) {
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst(cookieName);
        return cookie != null ? cookie.getValue() : null;
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Mono<Void> unauthorizedResponse(ServerWebExchange exchange, String reason) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("X-Auth-Error", reason);
        return exchange.getResponse().setComplete();
    }

    private Mono<Void> forbiddenResponse(ServerWebExchange exchange, String reason) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        exchange.getResponse().getHeaders().add("X-Auth-Error", reason);
        return exchange.getResponse().setComplete();
    }
}
