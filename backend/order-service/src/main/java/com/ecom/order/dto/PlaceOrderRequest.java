package com.ecom.order.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for placing a new order.
 * Used by: POST /api/orders
 *
 * The order items come from the user's cart (fetched via Feign from cart-service),
 * NOT from the request body. The client only needs to provide a shipping address.
 *
 * Why not send items in the request?
 *   The cart already has the items. Sending them again would:
 *   1. Allow the client to tamper with prices
 *   2. Create inconsistency between cart and order
 *   3. Duplicate data transfer unnecessarily
 */
@Data
public class PlaceOrderRequest {

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;
}
