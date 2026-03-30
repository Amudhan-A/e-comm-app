package com.ecom.product.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Product is the core MongoDB document for the product-service.
 *
 * Design decisions worth noting:
 *
 * 1. BigDecimal for price — Never use double or float for money.
 *    Floating-point types have rounding errors (0.1 + 0.2 = 0.30000000000000004).
 *    BigDecimal is exact and is the Java standard for monetary values.
 *
 * 2. @TextIndexed on name and description — MongoDB full-text search index.
 *    This allows us to do efficient keyword search like "search for sony headphones"
 *    across both the product name and its description.
 *
 * 3. @Indexed on category — We will frequently filter products by category
 *    (e.g. "show all ELECTRONICS"). An index makes this query fast even with
 *    millions of documents.
 *
 * 4. stock as int — tracks available inventory. When an order is placed,
 *    the order-service will call this service to decrement stock.
 */
@Document(collection = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private String id;

    @TextIndexed // part of the full-text search index for keyword search
    private String name;

    @TextIndexed // also searchable by description keywords
    private String description;

    // BigDecimal for exact monetary representation — no floating point errors
    private BigDecimal price;

    // Number of units available in inventory
    private int stock;

    // Indexed for fast filtering queries like "GET /api/products?category=ELECTRONICS"
    @Indexed
    private Category category;

    // URL to the product image (stored externally, e.g., S3, Cloudinary, or placeholder)
    private String imageUrl;

    // Seller's user ID from auth-service — used to identify who listed this product
    // (useful if you later add a multi-vendor/seller feature)
    private String sellerId;

    // Whether the product is visible in the store (soft delete / deactivation)
    @Builder.Default
    private boolean active = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
