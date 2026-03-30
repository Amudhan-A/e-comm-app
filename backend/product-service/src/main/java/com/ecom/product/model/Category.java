package com.ecom.product.model;

/**
 * Enum representing all product categories in the store.
 *
 * Using an enum (instead of a plain String) means:
 *   - Category values are validated at compile time — you can't accidentally
 *     save "ELECTORNICS" (typo) to the database
 *   - MongoDB stores it as a String e.g. "ELECTRONICS"
 *   - Adding a new category is one line here + it's immediately available everywhere
 */
public enum Category {
    ELECTRONICS,
    CLOTHING,
    FOOTWEAR,
    BOOKS,
    HOME_AND_KITCHEN,
    SPORTS,
    BEAUTY,
    TOYS,
    GROCERIES,
    OTHER
}
