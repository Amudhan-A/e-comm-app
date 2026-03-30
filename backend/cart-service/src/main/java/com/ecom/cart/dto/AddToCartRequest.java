package com.ecom.cart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for adding a product to the cart.
 * Used by: POST /api/cart/items
 *
 * Why do we send productName, price, and imageUrl from the client?
 *
 *   Option A: Client sends just productId → cart-service calls product-service to get details
 *   Option B: Client sends the product details alongside the productId (this approach)
 *
 *   We chose Option B to avoid an inter-service HTTP call on every "Add to Cart" action.
 *   The frontend already has the product details (it's showing the product page),
 *   so it can include them in the request. The cart-service just stores the snapshot.
 *
 *   Trade-off: we trust the client to send correct data. In a stricter production system,
 *   you'd verify the price against product-service. For this project, Option B is fine.
 */
@Data
public class AddToCartRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotBlank(message = "Product name is required")
    private String productName;

    // Optional — cart can display a thumbnail image
    private String imageUrl;

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    private BigDecimal price;

    // How many units to add — must be at least 1
    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;
}
