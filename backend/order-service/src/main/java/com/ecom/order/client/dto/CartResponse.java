package com.ecom.order.client.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO that mirrors the CartResponse from the cart-service.
 *
 * This is a LOCAL copy in the order-service — we don't share DTOs across services.
 * Each microservice owns its own DTOs. If the cart-service changes its response shape,
 * we update this class to match.
 *
 * Used by: CartServiceClient Feign interface
 */
@Data
public class CartResponse {

    private String cartId;
    private String userId;
    private List<CartItemResponse> items;
    private int totalItems;
    private BigDecimal totalAmount;
    private Instant updatedAt;

    @Data
    public static class CartItemResponse {
        private String productId;
        private String productName;
        private String imageUrl;
        private BigDecimal price;
        private int quantity;
        private BigDecimal subtotal;
    }
}
