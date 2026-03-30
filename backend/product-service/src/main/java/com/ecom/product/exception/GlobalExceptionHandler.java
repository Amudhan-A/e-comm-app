package com.ecom.product.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Catches all exceptions thrown by the product-service controllers and service layer,
 * and converts them into consistent JSON error responses.
 *
 * Every error response follows the same shape:
 * {
 *   "status": 404,
 *   "error": "Not Found",
 *   "message": "Product not found with id: abc123",
 *   "timestamp": "2026-03-30T17:30:00Z"
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Validation Errors (400) ───────────────────────────────────────────────

    /**
     * Triggered when @Valid fails on a ProductRequest body.
     * Returns all field validation errors at once (not just the first one).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message   = error.getDefaultMessage();
            fieldErrors.put(fieldName, message);
        });

        return ResponseEntity.badRequest().body(Map.of(
                "status",    400,
                "error",     "Validation Failed",
                "errors",    fieldErrors,
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Invalid Enum Parameter (400) ──────────────────────────────────────────

    /**
     * Triggered when an invalid category value is passed as a query param.
     * Example: GET /api/products?category=INVALID_CATEGORY
     *
     * Without this handler, Spring returns a cryptic 400 with no explanation.
     * With it, we return a helpful message listing the valid values.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex
    ) {
        String message = "Invalid value '" + ex.getValue() + "' for parameter '" + ex.getName() + "'";

        // If it's an enum mismatch, list all the valid enum constants
        if (ex.getRequiredType() != null && ex.getRequiredType().isEnum()) {
            Object[] constants = ex.getRequiredType().getEnumConstants();
            message += ". Accepted values: " + java.util.Arrays.toString(constants);
        }

        return ResponseEntity.badRequest().body(Map.of(
                "status",    400,
                "error",     "Bad Request",
                "message",   message,
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Product Not Found (404) ───────────────────────────────────────────────

    /**
     * Thrown by ProductService when a product ID doesn't exist or the product
     * is inactive. RuntimeException is used here — we'll refactor to a custom
     * ProductNotFoundException class later when the project grows.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        // Check if this is a "not found" type error vs a real server error
        boolean isNotFound = ex.getMessage() != null &&
                (ex.getMessage().contains("not found") ||
                 ex.getMessage().contains("Insufficient stock"));

        HttpStatus status = isNotFound ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
        String error = isNotFound ? "Not Found" : "Internal Server Error";
        String message = isNotFound ? ex.getMessage() : "An unexpected error occurred";

        return ResponseEntity.status(status).body(Map.of(
                "status",    status.value(),
                "error",     error,
                "message",   message,
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Catch-All (500) ───────────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "status",    500,
                "error",     "Internal Server Error",
                "message",   "An unexpected error occurred. Please try again later.",
                "timestamp", Instant.now().toString()
        ));
    }
}
