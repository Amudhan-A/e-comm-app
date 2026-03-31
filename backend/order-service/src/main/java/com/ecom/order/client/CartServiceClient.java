package com.ecom.order.client;

import com.ecom.order.client.dto.CartResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

/**
 * Feign client for communicating with the Cart Service.
 *
 * Used during checkout to:
 *   1. Fetch the user's cart (to get the items being ordered)
 *   2. Clear the cart after a successful order placement
 *
 * The URL is configured in application.properties as 'cart-service.url'.
 * In production with service discovery, you'd use the service name instead.
 */
@FeignClient(name = "cart-service", url = "${cart-service.url}")
public interface CartServiceClient {

    /**
     * Fetch the user's current cart.
     * Maps to: GET /api/cart in the cart-service.
     *
     * The X-User-Id header identifies which user's cart to retrieve.
     * In the real flow, the API Gateway injects this, but when order-service
     * calls cart-service directly via Feign, we pass it ourselves.
     */
    @GetMapping("/api/cart")
    CartResponse getCart(@RequestHeader("X-User-Id") String userId);

    /**
     * Clear the user's cart after successful order placement.
     * Maps to: DELETE /api/cart in the cart-service.
     */
    @DeleteMapping("/api/cart")
    void clearCart(@RequestHeader("X-User-Id") String userId);
}
