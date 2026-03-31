package com.ecom.order.dto;

import com.ecom.order.model.OrderStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO returned when fetching order data.
 * Used by: GET /api/orders, GET /api/orders/{id}, POST /api/orders
 *
 * Contains full order details including all line items, totals, and status.
 */
@Data
@Builder
public class OrderResponse {

    private String orderId;
    private String userId;
    private List<OrderItemResponse> items;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private String shippingAddress;
    private int totalItems;
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Nested DTO representing one line item in the order response.
     * Static inner class — only used inside OrderResponse.
     */
    @Data
    @Builder
    public static class OrderItemResponse {
        private String productId;
        private String productName;
        private String imageUrl;
        private BigDecimal price;
        private int quantity;
        private BigDecimal subtotal;
    }
}
