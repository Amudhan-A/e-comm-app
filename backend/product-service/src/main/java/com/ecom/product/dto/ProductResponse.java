package com.ecom.product.dto;

import com.ecom.product.model.Category;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO returned in responses when fetching product data.
 * Used by: GET /api/products, GET /api/products/{id}, etc.
 *
 * Differences from the Product entity:
 *   - No 'sellerId' field exposed (internal concern, not needed by the client)
 *   - 'inStock' boolean computed from 'stock > 0' — gives the UI a simple flag
 *     to show "In Stock" or "Out of Stock" without the client doing math
 *   - 'active' field not exposed — inactive products shouldn't appear in results
 *     (they're filtered out at the service layer before mapping to this DTO)
 */
@Data
@Builder
public class ProductResponse {

    private String id;
    private String name;
    private String description;
    private BigDecimal price;
    private int stock;
    private Category category;
    private String imageUrl;

    // Computed convenience flag: true if stock > 0
    // Makes frontend display logic simpler: just check product.inStock
    private boolean inStock;

    private Instant createdAt;
    private Instant updatedAt;
}
