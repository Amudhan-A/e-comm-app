package com.ecom.order.exception;

import feign.FeignException;
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
 * GlobalExceptionHandler for the order-service.
 * Converts exceptions into consistent JSON error responses.
 *
 * Standard response shape:
 * {
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Cannot place order: your cart is empty.",
 *   "timestamp": "2026-03-31T10:00:00Z"
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Validation Errors (400) ───────────────────────────────────────────────

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

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex
    ) {
        String message = "Invalid value '" + ex.getValue() + "' for parameter '" + ex.getName() + "'";

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

    // ── Feign Errors (502 Bad Gateway) ────────────────────────────────────────

    /**
     * Catches errors from Feign calls to other microservices.
     * This happens when cart-service or product-service is down or returns an error.
     */
    @ExceptionHandler(FeignException.class)
    public ResponseEntity<Map<String, Object>> handleFeignException(FeignException ex) {
        HttpStatus status = HttpStatus.BAD_GATEWAY;
        String message = "A downstream service is unavailable. Please try again later.";

        // If the downstream service returned a client error (4xx), pass it through
        if (ex.status() >= 400 && ex.status() < 500) {
            status = HttpStatus.BAD_REQUEST;
            message = "Request failed: " + ex.contentUTF8();
        }

        return ResponseEntity.status(status).body(Map.of(
                "status",    status.value(),
                "error",     status.getReasonPhrase(),
                "message",   message,
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Business Logic Errors (400 / 404) ─────────────────────────────────────

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        boolean isNotFound = ex.getMessage() != null && ex.getMessage().contains("not found");

        HttpStatus status = isNotFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
        String error = isNotFound ? "Not Found" : "Bad Request";

        return ResponseEntity.status(status).body(Map.of(
                "status",    status.value(),
                "error",     error,
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
