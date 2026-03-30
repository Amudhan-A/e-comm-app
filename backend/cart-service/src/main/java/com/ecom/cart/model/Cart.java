package com.ecom.cart.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Cart is the top-level MongoDB document for the cart-service.
 *
 * Data model: ONE cart per user, always.
 * A user either has a cart document or they don't.
 *
 * The cart contains a List<CartItem>, stored as embedded sub-documents
 * in the same MongoDB document (not a separate collection).
 *
 * Document shape in MongoDB:
 * {
 *   "_id": "...",
 *   "userId": "user-abc-123",
 *   "items": [
 *     { "productId": "p1", "productName": "Sony Headphones", "price": 24999.99, "quantity": 2 },
 *     { "productId": "p2", "productName": "USB Cable", "price": 199.00, "quantity": 1 }
 *   ],
 *   "updatedAt": "2026-03-30T17:00:00Z"
 * }
 *
 * Why embed items instead of a separate collection?
 *   The cart and its items are always read/written together — you never need
 *   "give me just one cart item". Embedding is faster (1 DB read, not 1+N)
 *   and MongoDB handles it naturally.
 */
@Document(collection = "carts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cart {

    @Id
    private String id;

    // One cart per user — indexed for fast lookup by userId
    @Indexed(unique = true)
    private String userId;

    // All items in the cart, embedded in this document
    @Builder.Default
    private List<CartItem> items = new ArrayList<>();

    // Tracks when the cart was last modified
    // Useful for expiring abandoned carts (e.g., clear carts not updated in 30 days)
    @LastModifiedDate
    private Instant updatedAt;
}
