package com.ecom.order.model;

/**
 * Enum representing all possible states an order can be in.
 *
 * Lifecycle: PLACED → CONFIRMED → SHIPPED → DELIVERED
 *            PLACED → CANCELLED  (can only cancel before shipping)
 *
 * PLACED     — order just created, payment assumed successful (no payment service yet)
 * CONFIRMED  — seller/admin acknowledged the order
 * SHIPPED    — order dispatched, in transit
 * DELIVERED  — customer received the order
 * CANCELLED  — order was cancelled before shipment
 */
public enum OrderStatus {
    PLACED,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
