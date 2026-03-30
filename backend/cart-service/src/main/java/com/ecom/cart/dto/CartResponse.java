package com.ecom.cart.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO returned when a user fetches or modifies their cart.
 * Used by: GET /api/cart, POST /api/cart/items, DELETE /api/cart/items/{productId}, etc.
 *
 * Contains:
 *   - The list of cart items (mapped from CartItem sub-documents)
 *   - totalItems  → total number of individual units (e.g., 2 headphones + 1 cable = 3)
 *   - totalAmount → grand total price, pre-computed so the frontend doesn't have to sum it
 *   - updatedAt   → useful for showing "Cart last updated 5 minutes ago"
 */
@Data
@Builder
public class CartResponse {

    private String cartId;
    private String userId;

    // The items in this cart, each as a flat DTO (no sub-document nesting exposed)
    private List<CartItemResponse> items;

    // Sum of all quantities: useful for the cart icon badge count (e.g., "🛒 3")
    private int totalItems;

    // Grand total: sum of (price × quantity) for all items
    private BigDecimal totalAmount;

    private Instant updatedAt;

    /**
     * Nested DTO representing one line item in the cart response.
     *
     * It's a static inner class because it's only ever used inside CartResponse
     * and doesn't need its own file. Keeps the dto package clean.
     */
    @Data
    @Builder
    public static class CartItemResponse {
        private String productId;
        private String productName;
        private String imageUrl;
        private BigDecimal price;
        private int quantity;

        // Line total: price × quantity — precomputed for the UI
        // e.g. "₹24,999 × 2 = ₹49,998"
        private BigDecimal subtotal;
    }
}
