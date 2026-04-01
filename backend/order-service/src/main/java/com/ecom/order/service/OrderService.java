package com.ecom.order.service;

import com.ecom.order.client.CartServiceClient;
import com.ecom.order.client.ProductServiceClient;
import com.ecom.order.client.dto.CartResponse;
import com.ecom.order.dto.OrderResponse;
import com.ecom.order.dto.PagedResponse;
import com.ecom.order.dto.PlaceOrderRequest;
import com.ecom.order.model.Order;
import com.ecom.order.model.OrderItem;
import com.ecom.order.model.OrderStatus;
import com.ecom.order.repository.OrderRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * OrderService — all business logic for order operations.
 *
 * The checkout flow is the most complex operation in the entire e-commerce system:
 *   1. Fetch the user's cart from cart-service via Feign
 *   2. Validate the cart is not empty
 *   3. Reduce stock for each item via product-service Feign calls
 *   4. Create the Order document with all items
 *   5. Clear the user's cart via cart-service Feign call
 *   6. Return the order response
 *
 * Note: This is a "best-effort" transaction. In a production system, you'd use
 * the Saga pattern or event-driven compensation for distributed transactions.
 * For this project, we handle errors gracefully but don't implement full rollback.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartServiceClient cartServiceClient;
    private final ProductServiceClient productServiceClient;

    // ── Place Order (Checkout) ────────────────────────────────────────────────

    /**
     * The main checkout method. Orchestrates the entire order placement flow.
     *
     * Steps:
     *   1. Fetch cart from cart-service
     *   2. Validate cart is not empty
     *   3. Reduce stock for each product via product-service
     *   4. Build and save the Order document
     *   5. Clear the cart
     *   6. Return order details
     */
    public OrderResponse placeOrder(String userId, PlaceOrderRequest request) {

        // Step 1: Fetch the user's cart
        CartResponse cart;
        try {
            cart = cartServiceClient.getCart(userId);
        } catch (FeignException e) {
            log.error("Failed to fetch cart for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Unable to fetch cart. Please try again later.");
        }

        // Step 2: Validate cart is not empty
        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new RuntimeException("Cannot place order: your cart is empty.");
        }

        // Step 3: Reduce stock for each cart item
        for (CartResponse.CartItemResponse cartItem : cart.getItems()) {
            try {
                productServiceClient.reduceStock(cartItem.getProductId(), cartItem.getQuantity());
            } catch (FeignException e) {
                log.error("Failed to reduce stock for product {}: {}",
                        cartItem.getProductId(), e.getMessage());
                throw new RuntimeException(
                        "Failed to reserve stock for '" + cartItem.getProductName()
                        + "'. It may be out of stock. Please update your cart and try again.");
            }
        }

        // Step 4: Build the Order document from cart items
        List<OrderItem> orderItems = cart.getItems().stream()
                .map(cartItem -> OrderItem.builder()
                        .productId(cartItem.getProductId())
                        .productName(cartItem.getProductName())
                        .imageUrl(cartItem.getImageUrl())
                        .price(cartItem.getPrice())
                        .quantity(cartItem.getQuantity())
                        .build())
                .toList();

        BigDecimal totalAmount = orderItems.stream()
                .map(OrderItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Order order = Order.builder()
                .userId(userId)
                .items(orderItems)
                .totalAmount(totalAmount)
                .status(OrderStatus.PLACED)
                .shippingAddress(request.getShippingAddress())
                .build();

        Order savedOrder = orderRepository.save(order);

        // Step 5: Clear the user's cart after successful order
        try {
            cartServiceClient.clearCart(userId);
        } catch (FeignException e) {
            // Non-critical failure — order is already placed, just log the error
            // The cart can be cleared manually or on next checkout attempt
            log.warn("Order placed successfully but failed to clear cart for user {}: {}",
                    userId, e.getMessage());
        }

        // Step 6: Return the order response
        return mapToResponse(savedOrder);
    }

    // ── Get Single Order ──────────────────────────────────────────────────────

    /**
     * Fetch a specific order by its ID.
     * Validates that the order belongs to the requesting user.
     */
    public OrderResponse getOrderById(String orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // Security check: users can only view their own orders
        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Order not found with id: " + orderId);
        }

        return mapToResponse(order);
    }

    // ── Get User's Orders (Paginated) ─────────────────────────────────────────

    /**
     * Fetch all orders for a user with pagination.
     * Default: newest orders first, 10 per page.
     */
    public PagedResponse<OrderResponse> getUserOrders(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        return buildPagedResponse(orderPage);
    }

    /**
     * Fetch all orders in the system with pagination (Admin only).
     * Default: newest orders first, 10 per page.
     */
    public PagedResponse<OrderResponse> getAllOrders(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage = orderRepository.findAll(pageable);
        return buildPagedResponse(orderPage);
    }

    // ── Cancel Order ──────────────────────────────────────────────────────────

    /**
     * Cancel an order. Only allowed if the order is still in PLACED status.
     * Once confirmed/shipped, cancellation is not permitted.
     *
     * Note: In a full system, cancelling would also restore stock via product-service.
     * For now, we just update the status.
     */
    public OrderResponse cancelOrder(String orderId, String userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        if (!order.getUserId().equals(userId)) {
            throw new RuntimeException("Order not found with id: " + orderId);
        }

        if (order.getStatus() != OrderStatus.PLACED) {
            throw new RuntimeException(
                    "Cannot cancel order. Current status: " + order.getStatus()
                    + ". Only orders in PLACED status can be cancelled.");
        }

        // Restore stock for each item in the order
        for (OrderItem item : order.getItems()) {
            try {
                productServiceClient.restoreStock(item.getProductId(), item.getQuantity());
            } catch (FeignException e) {
                // Log the error but continue cancelling the order
                // Stock restoration is a best-effort during cancellation
                log.error("Failed to restore stock for product {} during order {} cancellation: {}",
                        item.getProductId(), orderId, e.getMessage());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        return mapToResponse(orderRepository.save(order));
    }

    // ── Update Order Status (Admin) ───────────────────────────────────────────

    /**
     * Update the status of an order.
     * This is an admin operation — used to move orders through the lifecycle:
     *   PLACED → CONFIRMED → SHIPPED → DELIVERED
     *
     * Enforces valid state transitions.
     */
    public OrderResponse updateOrderStatus(String orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        // Prevent illogical transitions
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new RuntimeException("Cannot update status of a cancelled order.");
        }

        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new RuntimeException("Cannot update status of a delivered order.");
        }

        order.setStatus(newStatus);
        return mapToResponse(orderRepository.save(order));
    }

    // ── Mapping Helper ────────────────────────────────────────────────────────

    private OrderResponse mapToResponse(Order order) {
        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderResponse.OrderItemResponse.builder()
                        .productId(item.getProductId())
                        .productName(item.getProductName())
                        .imageUrl(item.getImageUrl())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .build())
                .toList();

        int totalItems = order.getItems().stream()
                .mapToInt(OrderItem::getQuantity)
                .sum();

        return OrderResponse.builder()
                .orderId(order.getId())
                .userId(order.getUserId())
                .items(itemResponses)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .shippingAddress(order.getShippingAddress())
                .totalItems(totalItems)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private PagedResponse<OrderResponse> buildPagedResponse(Page<Order> page) {
        List<OrderResponse> content = page.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<OrderResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
