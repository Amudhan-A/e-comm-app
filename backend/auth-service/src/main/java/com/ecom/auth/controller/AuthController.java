package com.ecom.auth.controller;

import com.ecom.auth.dto.AuthResponse;
import com.ecom.auth.dto.LoginRequest;
import com.ecom.auth.dto.RegisterRequest;
import com.ecom.auth.dto.UserProfileResponse;
import com.ecom.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController is intentionally thin — it just maps HTTP requests to service calls.
 * All business logic, validation logic, and cookie-setting lives in AuthService.
 *
 * Endpoints:
 *   POST   /api/auth/register  → create new account
 *   POST   /api/auth/login     → authenticate and get tokens in cookies
 *   POST   /api/auth/refresh   → exchange refresh token for new access token
 *   POST   /api/auth/logout    → clear tokens from DB and cookies
 *   GET    /api/auth/me        → get current user's profile (requires valid token)
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user.
     *
     * @Valid triggers Bean Validation on RegisterRequest before the method body runs.
     * If validation fails, Spring throws MethodArgumentNotValidException,
     * which is caught by GlobalExceptionHandler and returned as a clean 400 response.
     *
     * HttpServletResponse is passed to the service so it can set HttpOnly cookies.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.register(request, response));
    }

    /**
     * Authenticate an existing user.
     *
     * On success: access + refresh tokens are set as HttpOnly cookies.
     * Response body: user info (no tokens in the body).
     *
     * On failure: AuthenticationManager throws BadCredentialsException
     * → caught by GlobalExceptionHandler → 401 Unauthorized.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.login(request, response));
    }

    /**
     * Refresh the access token.
     *
     * The client doesn't need to send anything in the body — the refresh token
     * is automatically read from its HttpOnly cookie by the service.
     *
     * Typical use case: access token expired (15 min) → call this → get a new one.
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.refreshToken(request, response));
    }

    /**
     * Logout the current user.
     *
     * Clears the refresh token from the DB and instructs the browser
     * to delete both cookies via Max-Age=0.
     *
     * Returns 204 No Content — logout doesn't need a response body.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get the currently authenticated user's profile.
     *
     * @AuthenticationPrincipal injects the UserDetails object that JwtAuthFilter
     * placed into the SecurityContext. We use it to get the email (username)
     * and pass it to the service to load the full profile from MongoDB.
     *
     * This endpoint requires a valid accessToken cookie (enforced by SecurityConfig).
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }
}
