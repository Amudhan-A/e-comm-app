package com.ecom.product.repository;

import com.ecom.product.model.Category;
import com.ecom.product.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

/**
 * ProductRepository provides all database operations for the Product collection.
 *
 * Spring Data MongoDB auto-generates the implementations for all methods here
 * based purely on the method name — no SQL or Mongo query needed.
 *
 * The 'Pageable' parameter is how we request a specific page of results.
 * Spring handles the skip/limit logic automatically.
 * Example: Pageable.of(page=0, size=20, sort=price,asc)
 */
public interface ProductRepository extends MongoRepository<Product, String> {

    /**
     * Get all ACTIVE products (paginated).
     * "active = true" means not soft-deleted.
     * This is the main query for the product listing page.
     */
    Page<Product> findByActiveTrue(Pageable pageable);

    /**
     * Get all ACTIVE products filtered by a specific category.
     * Used when the user clicks a category filter on the frontend.
     * Example: GET /api/products?category=ELECTRONICS
     *
     * MongoDB uses the @Indexed field on 'category' to make this fast.
     */
    Page<Product> findByCategoryAndActiveTrue(Category category, Pageable pageable);

    /**
     * Full-text keyword search across 'name' and 'description' fields.
     *
     * @Query uses raw MongoDB JSON query syntax for cases where
     * method-name derivation isn't enough.
     *
     * $text: { $search: ?0 } = MongoDB full-text search on @TextIndexed fields
     * { active: true } = only return active (non-deleted) products
     *
     * Example: GET /api/products?keyword=wireless+headphones
     * MongoDB will find products where name OR description contains those words.
     */
    @Query("{ $text: { $search: ?0 }, active: true }")
    Page<Product> searchByKeyword(String keyword, Pageable pageable);

    /**
     * Regex-based fallback search when $text index is unavailable.
     * Searches 'name' field with case-insensitive regex matching.
     * Slower than $text but works without requiring a text index.
     */
    @Query("{ 'name': { $regex: ?0, $options: 'i' }, active: true }")
    Page<Product> searchByNameRegex(String keyword, Pageable pageable);

    /**
     * Combined keyword + category search.
     * Searches 'name' with case-insensitive regex AND filters by category.
     * Used when the user types a search query while a category filter is active.
     */
    @Query("{ 'name': { $regex: ?0, $options: 'i' }, 'category': ?1, active: true }")
    Page<Product> searchByNameRegexAndCategory(String keyword, Category category, Pageable pageable);

    /**
     * Check if any product exists with this exact name (used to prevent duplicates).
     * Case-insensitive comparison via the regex flag 'i'.
     */
    @Query("{ name: { $regex: ?0, $options: 'i' }, active: true }")
    boolean existsByNameIgnoreCase(String name);
}
