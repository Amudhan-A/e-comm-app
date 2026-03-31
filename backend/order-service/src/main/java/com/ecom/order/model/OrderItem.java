package com.ecom.order.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * OrderItem represents a single product line inside an order.
 *
 * This is NOT a MongoDB @Document — it has no @Id.
 * It's an embedded sub-document stored inside the Order document.
 *
 * All fields are snapshotted at order-placement time so the order
 * record is permanent — even if the product's price or name changes
 * later, the order reflects what the customer actually paid.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    private String productId;

    // Snapshotted at order time — immutable record of what was ordered
    private String productName;
    private String imageUrl;

    // Per-unit price at the time of order
    private BigDecimal price;

    // How many units of this product were ordered
    private int quantity;

    /**
     * Line total: price × quantity
     * e.g., ₹24,999 × 2 = ₹49,998
     */
    public BigDecimal getSubtotal() {
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}
