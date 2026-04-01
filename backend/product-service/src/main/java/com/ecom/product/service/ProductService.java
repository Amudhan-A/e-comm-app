package com.ecom.product.service;

import com.ecom.product.dto.PagedResponse;
import com.ecom.product.dto.ProductRequest;
import com.ecom.product.dto.ProductResponse;
import com.ecom.product.model.Category;
import com.ecom.product.model.Product;
import com.ecom.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * ProductService contains all business logic for product operations.
 *
 * The controller delegates everything here.
 * All Product entities are mapped to ProductResponse DTOs before being returned —
 * the raw entity NEVER leaves this service layer.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Creates a new product. Only admins will be allowed to call this
     * (enforced at the API Gateway level via JWT role check).
     *
     * sellerId is passed from the controller, which extracts it from
     * the JWT token so the client can't spoof it.
     */
    public ProductResponse createProduct(ProductRequest request, String sellerId) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .category(request.getCategory())
                .imageUrl(request.getImageUrl())
                .sellerId(sellerId)
                .active(true)
                .build();

        return mapToResponse(productRepository.save(product));
    }

    // ── Read (single) ─────────────────────────────────────────────────────────

    /**
     * Fetch a single product by its MongoDB ID.
     * Throws ProductNotFoundException (caught by GlobalExceptionHandler) if not found.
     */
    public ProductResponse getProductById(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        // Don't return products that have been deactivated (soft-deleted)
        if (!product.isActive()) {
            throw new RuntimeException("Product not found with id: " + id);
        }

        return mapToResponse(product);
    }

    // ── Read (paginated list) ─────────────────────────────────────────────────

    /**
     * The main product listing endpoint. Supports:
     *   - Keyword search across name + description
     *   - Category filter
     *   - Sorting by price or createdAt
     *   - Pagination (page + size)
     *
     * Only ONE of keyword or category can filter at a time.
     * If both are provided, keyword takes priority.
     * If neither is provided, all active products are returned.
     *
     * @param page     zero-based page index (0 = first page)
     * @param size     number of products per page
     * @param sort     field to sort by: "price", "createdAt", "name"
     * @param order    sort direction: "asc" or "desc"
     * @param category filter by category (optional)
     * @param keyword  full-text search keyword (optional)
     */
    public PagedResponse<ProductResponse> getAllProducts(
            int page, int size,
            String sort, String order,
            Category category,
            String keyword
    ) {
        // Build the Sort object — default to descending (newest first)
        Sort.Direction direction = "asc".equalsIgnoreCase(order)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));

        Page<Product> productPage;

        if (keyword != null && !keyword.isBlank()) {
            // Keyword search — with or without a category filter
            Pageable unsortedPageable = PageRequest.of(page, size);

            if (category != null) {
                // Combined: keyword + category filter
                // Use regex search which supports category AND sorting
                productPage = productRepository.searchByNameRegexAndCategory(
                        keyword.trim(), category, pageable);
            } else {
                // Keyword only, no category filter
                // Try $text search first (most relevant results), fall back to regex
                try {
                    productPage = productRepository.searchByKeyword(keyword.trim(), unsortedPageable);
                } catch (Exception e) {
                    productPage = productRepository.searchByNameRegex(keyword.trim(), pageable);
                }
            }

        } else if (category != null) {
            // Category filter only, no keyword
            productPage = productRepository.findByCategoryAndActiveTrue(category, pageable);

        } else {
            // No filter — return all active products
            productPage = productRepository.findByActiveTrue(pageable);
        }

        // Map Page<Product> → PagedResponse<ProductResponse>
        return buildPagedResponse(productPage);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /**
     * Updates an existing product's fields.
     * Only the fields in ProductRequest are updatable — internal fields
     * like sellerId, active, createdAt are never changed here.
     */
    public ProductResponse updateProduct(String id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        // Update only the fields the admin is allowed to change
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(request.getCategory());
        product.setImageUrl(request.getImageUrl());

        // @LastModifiedDate on the entity will auto-update updatedAt when saved
        return mapToResponse(productRepository.save(product));
    }

    // ── Stock Update (called by Order Service) ────────────────────────────────

    /**
     * Reduces stock when an order is placed.
     * Called internally by the order-service via a dedicated endpoint.
     *
     * @param id       product ID
     * @param quantity how many units were ordered
     * @throws RuntimeException if insufficient stock
     */
    public void reduceStock(String id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        if (product.getStock() < quantity) {
            throw new RuntimeException(
                "Insufficient stock for product: " + product.getName()
                + ". Available: " + product.getStock() + ", Requested: " + quantity
            );
        }

        product.setStock(product.getStock() - quantity);
        productRepository.save(product);
    }

    /**
     * Restore a product's stock by a given quantity when an order is cancelled.
     * Unlike reduceStock, this method always succeeds (unless product not found).
     *
     * @param id       product ID
     * @param quantity how many units to return to stock
     */
    public void restoreStock(String id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setStock(product.getStock() + quantity);
        productRepository.save(product);
    }

    // ── Soft Delete ───────────────────────────────────────────────────────────

    /**
     * Deactivates a product instead of deleting it from the database.
     *
     * Why soft delete?
     *   If we hard-delete a product that's part of old orders, those order records
     *   would have broken references. Soft delete preserves data integrity.
     *   The product simply becomes invisible in all listing/search queries.
     */
    public void deleteProduct(String id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setActive(false);
        productRepository.save(product);
    }

    // ── Mapping Helper ────────────────────────────────────────────────────────

    /**
     * Converts a Product entity into a ProductResponse DTO.
     * This is the ONLY place where this mapping happens — keeps it DRY.
     *
     * 'inStock' is computed here: true if stock > 0
     */
    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .stock(product.getStock())
                .category(product.getCategory())
                .imageUrl(product.getImageUrl())
                .inStock(product.getStock() > 0) // computed field
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    /**
     * Wraps a Spring Data Page<Product> into our custom PagedResponse<ProductResponse>.
     * Extracts all pagination metadata from Spring's Page object.
     */
    private PagedResponse<ProductResponse> buildPagedResponse(Page<Product> page) {
        List<ProductResponse> content = page.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return PagedResponse.<ProductResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }
}
