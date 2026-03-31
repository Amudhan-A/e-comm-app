package com.ecom.order.repository;

import com.ecom.order.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * OrderRepository — database operations for the Order collection.
 *
 * Unlike CartRepository (one cart per user), a user can have many orders.
 * So the main query is "find all orders for a user" with pagination.
 */
public interface OrderRepository extends MongoRepository<Order, String> {

    /**
     * Find all orders placed by a specific user, with pagination.
     * Returns newest orders first when sorted by createdAt desc.
     *
     * The @Indexed annotation on Order.userId ensures this query is fast.
     */
    Page<Order> findByUserId(String userId, Pageable pageable);
}
