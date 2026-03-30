package com.ecom.cart.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * CartItem represents a single product line inside a user's cart.
 *
 * This is NOT a MongoDB @Document — it has no @Id.
 * It's an embedded sub-document stored inside the Cart document.
 *
 * MongoDB stores it like this inside the cart:
 * {
 *   "items": [
 *     { "productId": "abc", "productName": "Sony Headphones", "price": 24999.99, "quantity": 2 },
 *     { "productId": "xyz", "productName": "Phone Case",      "price": 299.00,  "quantity": 1 }
 *   ]
 * }
 *
 * Why store productName and price here (denormalization)?
 *   When the user views their cart, we could call the product-service for each item to get
 *   the name and price, but that would be N inter-service calls for N cart items — slow!
 *   Instead, we snapshot the name and price at the time the user adds the item.
 *   This is a deliberate trade-off: the cart might show a slightly stale price
 *   if the admin updates the product, but cart performance is instant.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    // The product's ID in the product-service MongoDB
    private String productId;

    // Snapshotted at add-time so we don't need to call product-service on every cart view
    private String productName;
    private String imageUrl;

    // Price at the time the item was added to cart
    // This is the per-unit price, not the line total
    private BigDecimal price;

    // How many units of this product are in the cart
    private int quantity;

    /**
     * Convenience method: calculates the total cost for this line item.
     * price × quantity = subtotal
     * Used when computing the cart grand total.
     */
    public BigDecimal getSubtotal() {
        return price.multiply(BigDecimal.valueOf(quantity));
    }
}
