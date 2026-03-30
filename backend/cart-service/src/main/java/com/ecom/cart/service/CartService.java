package com.ecom.cart.service;

import com.ecom.cart.dto.AddToCartRequest;
import com.ecom.cart.dto.CartResponse;
import com.ecom.cart.model.Cart;
import com.ecom.cart.model.CartItem;
import com.ecom.cart.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * CartService — all business logic for cart operations.
 *
 * Core pattern: "get or create" cart.
 * Every method starts by loading the user's existing cart,
 * or creating a new empty one if the user hasn't added anything yet.
 * This means the cart is created lazily on first use.
 */
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;

    // ── Get Cart ──────────────────────────────────────────────────────────────

    /**
     * Returns the user's current cart, or an empty cart response if they have none.
     */
    public CartResponse getCart(String userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElse(Cart.builder().userId(userId).items(new ArrayList<>()).build());
        return mapToResponse(cart);
    }

    // ── Add Item ──────────────────────────────────────────────────────────────

    /**
     * Adds a product to the cart, or increases its quantity if it already exists.
     *
     * "Upsert" logic:
     *   - If the product is already in the cart → increment quantity
     *   - If it's new → append a new CartItem
     *
     * This is the most important cart operation and handles the
     * "user clicks Add to Cart 3 times" scenario correctly.
     */
    public CartResponse addToCart(String userId, AddToCartRequest request) {

        // 1. Get existing cart or create a new empty one
        Cart cart = cartRepository.findByUserId(userId)
                .orElse(Cart.builder()
                        .userId(userId)
                        .items(new ArrayList<>())
                        .build());

        List<CartItem> items = cart.getItems();

        // 2. Check if this product is already in the cart
        Optional<CartItem> existingItem = items.stream()
                .filter(item -> item.getProductId().equals(request.getProductId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // Product already in cart → just increment the quantity
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else {
            // New product → build a new CartItem and add it to the list
            CartItem newItem = CartItem.builder()
                    .productId(request.getProductId())
                    .productName(request.getProductName())
                    .imageUrl(request.getImageUrl())
                    .price(request.getPrice())
                    .quantity(request.getQuantity())
                    .build();
            items.add(newItem);
        }

        // 3. Save updated cart — @LastModifiedDate will auto-update updatedAt
        return mapToResponse(cartRepository.save(cart));
    }

    // ── Update Quantity ───────────────────────────────────────────────────────

    /**
     * Sets a cart item's quantity to a specific value.
     * Used when the user types "5" in the quantity box on the cart page.
     *
     * If quantity ≤ 0, the item is removed from the cart entirely.
     * This lets the frontend just call this endpoint for both update and remove.
     */
    public CartResponse updateQuantity(String userId, String productId, int quantity) {

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        if (quantity <= 0) {
            // Treat quantity of 0 as a remove request
            cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        } else {
            cart.getItems().stream()
                    .filter(item -> item.getProductId().equals(productId))
                    .findFirst()
                    .ifPresentOrElse(
                        item -> item.setQuantity(quantity),
                        () -> { throw new RuntimeException("Item not found in cart: " + productId); }
                    );
        }

        return mapToResponse(cartRepository.save(cart));
    }

    // ── Remove Item ───────────────────────────────────────────────────────────

    /**
     * Removes a single product from the cart, regardless of quantity.
     * Example: user clicks the "✕ Remove" button next to a cart item.
     */
    public CartResponse removeItem(String userId, String productId) {

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found for user: " + userId));

        boolean removed = cart.getItems().removeIf(item ->
                item.getProductId().equals(productId));

        if (!removed) {
            throw new RuntimeException("Item not found in cart: " + productId);
        }

        return mapToResponse(cartRepository.save(cart));
    }

    // ── Clear Cart ────────────────────────────────────────────────────────────

    /**
     * Deletes the user's entire cart document from MongoDB.
     *
     * Called in two scenarios:
     *   1. User manually clicks "Clear Cart"
     *   2. Order-service calls this after a successful order placement
     */
    public void clearCart(String userId) {
        cartRepository.deleteByUserId(userId);
    }

    // ── Mapping Helper ────────────────────────────────────────────────────────

    /**
     * Converts a Cart entity into a CartResponse DTO.
     * Also computes:
     *   - totalItems  → sum of all quantities
     *   - totalAmount → sum of all subtotals (price × quantity)
     */
    private CartResponse mapToResponse(Cart cart) {

        List<CartResponse.CartItemResponse> itemResponses = cart.getItems()
                .stream()
                .map(item -> CartResponse.CartItemResponse.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .imageUrl(item.getImageUrl())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal()) // price × qty from CartItem helper method
                        .build())
                .toList();

        // Sum all quantities for the cart badge count
        int totalItems = cart.getItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        // Sum all subtotals for the grand total
        BigDecimal totalAmount = cart.getItems().stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .cartId(cart.getId())
                .userId(cart.getUserId())
                .items(itemResponses)
                .totalItems(totalItems)
                .totalAmount(totalAmount)
                .updatedAt(cart.getUpdatedAt())
                .build();
    }
}
