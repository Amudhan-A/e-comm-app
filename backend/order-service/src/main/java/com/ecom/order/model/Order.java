package com.ecom.order.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Order is the top-level MongoDB document for the order-service.
 *
 * Data model: A user can have MANY orders (unlike cart which is 1-per-user).
 * Each order contains a List<OrderItem> stored as embedded sub-documents.
 *
 * Document shape in MongoDB:
 * {
 *   "_id": "...",
 *   "userId": "user-abc-123",
 *   "items": [
 *     { "productId": "p1", "productName": "Sony Headphones", "price": 24999.99, "quantity": 2 },
 *     { "productId": "p2", "productName": "USB Cable", "price": 199.00, "quantity": 1 }
 *   ],
 *   "totalAmount": 50197.99,
 *   "status": "PLACED",
 *   "shippingAddress": "123 Main St, Hyderabad",
 *   "createdAt": "2026-03-31T10:00:00Z",
 *   "updatedAt": "2026-03-31T10:00:00Z"
 * }
 */
@Document(collection = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    private String id;

    // Which user placed this order — indexed for fast lookup
    @Indexed
    private String userId;

    // All items in this order, embedded as sub-documents
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    // Grand total: sum of (price × quantity) for all items — computed at placement time
    private BigDecimal totalAmount;

    // Current status of the order in its lifecycle
    @Builder.Default
    private OrderStatus status = OrderStatus.PLACED;

    // Delivery address provided by the customer at checkout
    private String shippingAddress;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
