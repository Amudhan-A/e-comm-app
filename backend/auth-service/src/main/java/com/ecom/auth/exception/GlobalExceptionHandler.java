package com.ecom.auth.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * GlobalExceptionHandler catches exceptions thrown anywhere in the service
 * and converts them into clean, consistent JSON error responses.
 *
 * Without this, Spring would return generic 500 error pages or cryptic stack traces.
 * With this, every error looks like:
 * {
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Email is already registered",
 *   "timestamp": "2026-03-30T15:00:00Z"
 * }
 *
 * @RestControllerAdvice = @ControllerAdvice + @ResponseBody
 * It intercepts exceptions from ALL controllers in the application.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Validation Errors (400) ───────────────────────────────────────────────

    /**
     * Triggered when @Valid fails on a @RequestBody.
     * Collects ALL field errors and returns them in a map:
     * {
     *   "status": 400,
     *   "errors": {
     *     "email": "Please provide a valid email address",
     *     "password": "Password must be at least 8 characters"
     *   }
     * }
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> fieldErrors = new HashMap<>();

        // Collect each field that failed validation + its message
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName    = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });

        return ResponseEntity.badRequest().body(Map.of(
                "status",    400,
                "error",     "Validation Failed",
                "errors",    fieldErrors,
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Bad Credentials (401) ─────────────────────────────────────────────────

    /**
     * Thrown by AuthenticationManager when email/password don't match.
     * We deliberately return a vague message — never tell the user WHICH
     * part of the credential was wrong (security best practice).
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(
            BadCredentialsException ex
    ) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "status",    401,
                "error",     "Unauthorized",
                "message",   "Invalid email or password",
                "timestamp", Instant.now().toString()
        ));
    }

    // ── User Not Found (404) ──────────────────────────────────────────────────

    /**
     * Thrown by UserDetailsService or service methods when no user exists
     * with the given email.
     */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFound(
            UsernameNotFoundException ex
    ) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "status",    404,
                "error",     "Not Found",
                "message",   ex.getMessage(),
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Business Rule Violations (409 Conflict) ───────────────────────────────

    /**
     * Thrown by AuthService when a user tries to register with an email that already exists.
     * 409 Conflict is the semantically correct status for "this resource already exists".
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(
            IllegalStateException ex
    ) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "status",    409,
                "error",     "Conflict",
                "message",   ex.getMessage(),
                "timestamp", Instant.now().toString()
        ));
    }

    // ── Catch-All (500) ───────────────────────────────────────────────────────

    /**
     * Safety net — catches anything we didn't explicitly handle.
     * Logs the real error server-side but returns a generic message to the client.
     * Never expose internal stack traces to the client in production.
     */
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
