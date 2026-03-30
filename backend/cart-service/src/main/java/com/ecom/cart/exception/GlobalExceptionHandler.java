package com.ecom.cart.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler for the cart-service.
 * Converts unstructured exceptions into clean JSON responses for the frontend.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Validation Errors (400) ───────────────────────────────────────────────

    /**
     * Triggered when @Valid fails on an AddToCartRequest.
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

    // ── Bad Requests (400) ────────────────────────────────────────────────────

    /**
     * Thrown by CartService when trying to remove or update an item that isn't in the cart,
     * or when trying to access a non-existent cart for operations that require it.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        // RuntimeExceptions here are generally "invalid state" (e.g., item not found in cart)
        return ResponseEntity.badRequest().body(Map.of(
                "status",    400,
                "error",     "Bad Request",
                "message",   ex.getMessage(),
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
