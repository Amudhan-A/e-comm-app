package com.ecom.cart.repository;

import com.ecom.cart.model.Cart;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

/**
 * CartRepository — simple, only 2 custom methods needed.
 *
 * Because each user has exactly one cart, all we ever need is:
 *   1. Find the cart by userId
 *   2. Delete the cart by userId (used when clearing entirely)
 *
 * The standard MongoRepository methods (save, findById, delete) handle everything else.
 */
public interface CartRepository extends MongoRepository<Cart, String> {

    /**
     * Find a user's cart by their userId.
     * Returns Optional.empty() if the user has never added anything to their cart.
     * The service uses this to either load the existing cart or create a new one.
     */
    Optional<Cart> findByUserId(String userId);

    /**
     * Delete a user's entire cart by userId.
     * Used after a successful order placement to clear the cart.
     */
    void deleteByUserId(String userId);
}
