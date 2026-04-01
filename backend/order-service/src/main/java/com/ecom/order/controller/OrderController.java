package com.ecom.order.controller;

import com.ecom.order.dto.OrderResponse;
import com.ecom.order.dto.PagedResponse;
import com.ecom.order.dto.PlaceOrderRequest;
import com.ecom.order.model.OrderStatus;
import com.ecom.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * OrderController — maps HTTP requests to OrderService.
 * Intentionally thin: no business logic lives here.
 *
 * Endpoints:
 *   POST   /api/orders                    → Place a new order (checkout)
 *   GET    /api/orders                    → List user's orders (paginated)
 *   GET    /api/orders/{id}               → Get a specific order
 *   PATCH  /api/orders/{id}/cancel        → Cancel an order
 *   PATCH  /api/orders/{id}/status        → Update order status (admin)
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * Place a new order using items from the user's cart.
     * This is the checkout endpoint — the most important operation.
     *
     * Returns 201 Created with the full order details.
     */
    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(orderService.placeOrder(userId, request));
    }

    /**
     * List the current user's orders with pagination.
     * Default: 10 orders per page, newest first.
     */
    @GetMapping
    public ResponseEntity<PagedResponse<OrderResponse>> getUserOrders(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(orderService.getUserOrders(userId, page, size));
    }

    /**
     * List all orders in the entire system.
     * Accessible only by users with the ADMIN role.
     */
    @GetMapping("/all")
    public ResponseEntity<PagedResponse<OrderResponse>> getAllOrders(
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "USER") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (!"ROLE_ADMIN".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(orderService.getAllOrders(page, size));
    }

    /**
     * Get a specific order by ID.
     * Users can only view their own orders (enforced in service layer).
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(orderService.getOrderById(id, userId));
    }

    /**
     * Cancel an order.
     * Only allowed if the order is still in PLACED status.
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-user-1") String userId,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(orderService.cancelOrder(id, userId));
    }

    /**
     * Update order status (admin operation).
     * Used to move orders through: PLACED → CONFIRMED → SHIPPED → DELIVERED
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable String id,
            @RequestParam OrderStatus status
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }
}
