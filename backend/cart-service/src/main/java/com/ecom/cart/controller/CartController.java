package com.ecom.cart.controller;

import com.ecom.cart.dto.AddToCartRequest;
import com.ecom.cart.dto.CartResponse;
import com.ecom.cart.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * CartController — maps HTTP requests to CartService.
 *
 * Notice the @RequestHeader("X-User-Id"):
 * Every single cart operation requires a user ID because carts belong to specific users.
 * The API Gateway validates the JWT, extracts the user ID, and passes it securely
 * to this microservice via this header. Clients cannot forge it.
 *
 * Endpoints:
 *   GET    /api/cart                        → Get current user's cart
 *   POST   /api/cart/items                  → Add item to cart
 *   PATCH  /api/cart/items/{productId}      → Update quantity for an item
 *   DELETE /api/cart/items/{productId}      → Remove item from cart
 *   DELETE /api/cart                        → Clear entire cart
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * Get the active user's cart.
     * Returns an empty cart response if they just signed up and haven't added anything yet.
     */
    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            // In dev without gateway: provide it in swagger. In prod: gateway injects it.
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId
    ) {
        return ResponseEntity.ok(cartService.getCart(userId));
    }

    /**
     * Add a product to the cart.
     * If the product is already in the cart, this increases its quantity.
     */
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId,
            @Valid @RequestBody AddToCartRequest request
    ) {
        return ResponseEntity.ok(cartService.addToCart(userId, request));
    }

    /**
     * explicitly update the quantity of an existing cart item.
     * Example: User types "4" in the quantity box.
     */
    @PatchMapping("/items/{productId}")
    public ResponseEntity<CartResponse> updateQuantity(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId,
            @PathVariable String productId,
            @RequestParam int quantity
    ) {
        return ResponseEntity.ok(cartService.updateQuantity(userId, productId, quantity));
    }

    /**
     * Remove a specific item completely from the cart.
     */
    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId,
            @PathVariable String productId
    ) {
        return ResponseEntity.ok(cartService.removeItem(userId, productId));
    }

    /**
     * Clear the entire cart. 
     * Will be used later when the order-service successfully creates an order.
     */
    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId
    ) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }
}
