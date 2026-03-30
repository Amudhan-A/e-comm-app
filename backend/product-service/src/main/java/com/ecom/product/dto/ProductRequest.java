package com.ecom.product.dto;

import com.ecom.product.model.Category;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for creating or updating a product.
 * Used by: POST /api/products  and  PUT /api/products/{id}
 *
 * This is what a seller/admin sends in the request body.
 * The Product entity is NEVER directly accepted from the client —
 * DTOs let us control exactly what fields the client is allowed to set.
 * For example, the client should never be able to set 'createdAt' or 'sellerId'
 * directly — those are set by the server.
 */
@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 200, message = "Name must be between 3 and 200 characters")
    private String name;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    // @NotNull because @NotBlank doesn't work on non-String types
    // @Digits ensures the value doesn't have more than 2 decimal places (e.g. 99.99)
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 digits and 2 decimal places")
    private BigDecimal price;

    @Min(value = 0, message = "Stock cannot be negative")
    private int stock;

    @NotNull(message = "Category is required")
    private Category category;

    // Optional — product can exist without an image initially
    private String imageUrl;
}
