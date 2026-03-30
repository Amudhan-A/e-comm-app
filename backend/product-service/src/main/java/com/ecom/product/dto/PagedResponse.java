package com.ecom.product.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Generic wrapper for paginated API responses.
 *
 * Why pagination? You never want to return 10,000 products in a single API response.
 * Pagination splits results into pages (e.g., 20 products per page).
 *
 * This wrapper is returned by GET /api/products and contains:
 *   - The actual products for the current page (content)
 *   - Metadata so the frontend can render pagination controls:
 *       "Showing page 1 of 34  (672 total products)"
 *
 * Example response:
 * {
 *   "content": [ { product1 }, { product2 }, ... ],
 *   "pageNumber": 0,
 *   "pageSize": 20,
 *   "totalElements": 672,
 *   "totalPages": 34,
 *   "last": false
 * }
 */
@Data
@Builder
public class PagedResponse<T> {

    // The actual items on this page
    private List<T> content;

    // Current page index — Spring pagination is 0-based (page 0 = first page)
    private int pageNumber;

    // How many items per page
    private int pageSize;

    // Total number of items across ALL pages
    private long totalElements;

    // Total number of pages
    private int totalPages;

    // True if this is the last page — useful for "Load More" infinite scroll UIs
    private boolean last;
}
