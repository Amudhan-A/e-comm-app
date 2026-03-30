package com.ecom.product.controller;

import com.ecom.product.dto.PagedResponse;
import com.ecom.product.dto.ProductRequest;
import com.ecom.product.dto.ProductResponse;
import com.ecom.product.model.Category;
import com.ecom.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * ProductController — maps HTTP requests to ProductService.
 * Intentionally thin: no business logic lives here.
 *
 * Endpoints summary:
 *   GET    /api/products                → list all (paginated, filterable)
 *   GET    /api/products/{id}           → get single product
 *   POST   /api/products                → create (ADMIN only — enforced at Gateway)
 *   PUT    /api/products/{id}           → update (ADMIN only — enforced at Gateway)
 *   DELETE /api/products/{id}           → soft delete (ADMIN only — enforced at Gateway)
 *   PATCH  /api/products/{id}/stock     → reduce stock (called by order-service internally)
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * List all active products with optional filtering, sorting, and pagination.
     *
     * All parameters are optional — sensible defaults are applied:
     *   page=0, size=20, sort=createdAt, order=desc
     *
     * Example URLs:
     *   GET /api/products
     *   GET /api/products?category=ELECTRONICS&page=0&size=10
     *   GET /api/products?keyword=wireless+headphones&sort=price&order=asc
     */
    @GetMapping
    public ResponseEntity<PagedResponse<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "20")  int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(
            productService.getAllProducts(page, size, sort, order, category, keyword)
        );
    }

    /**
     * Get a single product by its ID.
     * Public endpoint — no authentication required.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable String id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    /**
     * Create a new product.
     * Access: ADMIN only (enforced by the API Gateway JWT role check).
     *
     * The seller ID is extracted from the 'X-User-Id' request header,
     * which the API Gateway injects after validating the JWT.
     * This prevents the client from forging their own seller identity.
     *
     * Returns 201 Created (not 200 OK) — semantically correct for resource creation.
     */
    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request,
            // In production: injected by API Gateway from the validated JWT
            // In local testing: provide any string manually in Swagger or Postman
            @RequestHeader(value = "X-User-Id", required = false, defaultValue = "test-seller") String sellerId
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productService.createProduct(request, sellerId));
    }

    /**
     * Update an existing product.
     * Access: ADMIN only.
     *
     * The entire product is replaced with the new values (PUT semantics).
     * For partial updates, a PATCH endpoint could be added later.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable String id,
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    /**
     * Soft-delete a product (sets active=false, does not remove from DB).
     * Access: ADMIN only.
     *
     * Returns 204 No Content — delete operations don't return a body.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reduce a product's stock by a given quantity.
     *
     * This is an INTERNAL endpoint — it's not meant to be called by the frontend.
     * It will be called by the order-service via OpenFeign when a customer places an order.
     *
     * @param id       the product ID
     * @param quantity how many units to deduct from stock
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<Void> reduceStock(
            @PathVariable String id,
            @RequestParam int quantity
    ) {
        productService.reduceStock(id, quantity);
        return ResponseEntity.ok().build();
    }
}
