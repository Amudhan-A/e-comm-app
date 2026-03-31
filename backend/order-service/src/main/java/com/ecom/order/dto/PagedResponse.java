package com.ecom.order.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Generic wrapper for paginated API responses.
 * Same pattern used across all microservices for consistency.
 *
 * Used by: GET /api/orders (list user's orders with pagination)
 */
@Data
@Builder
public class PagedResponse<T> {

    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;
}
