package com.ecom.auth.service;

import com.ecom.auth.dto.AuthResponse;
import com.ecom.auth.dto.LoginRequest;
import com.ecom.auth.dto.RegisterRequest;
import com.ecom.auth.dto.UserProfileResponse;
import com.ecom.auth.model.Role;
import com.ecom.auth.model.User;
import com.ecom.auth.repository.UserRepository;
import com.ecom.auth.security.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * AuthService contains all the business logic for authentication.
 * The controller stays thin — it delegates everything here.
 *
 * Cookies are set here (not in the controller) because setting the right
 * cookie attributes (HttpOnly, Secure, SameSite, MaxAge) is business-critical
 * security logic, not just a presentation concern.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    // ── Register ──────────────────────────────────────────────────────────────

    /**
     * Creates a new user account, hashes the password, saves to DB,
     * generates JWT tokens, and sets them as HttpOnly cookies.
     */
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {

        // 1. Check if email is already taken
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException("Email is already registered: " + request.getEmail());
        }

        // 2. Build the User entity
        //    NEVER store the raw password — always hash it with BCrypt first
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER) // all new sign-ups are customers by default
                .build();

        // 3. Save user to MongoDB
        User savedUser = userRepository.save(user);

        // 4. Generate access + refresh tokens
        String accessToken  = jwtService.generateAccessToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        // 5. Store the refresh token in the DB (we need it for rotation & revocation)
        savedUser.setRefreshToken(refreshToken);
        userRepository.save(savedUser);

        // 6. Send tokens to client as HttpOnly cookies (not in the response body)
        addAccessTokenCookie(response, accessToken);
        addRefreshTokenCookie(response, refreshToken);

        // 7. Return user info in the response body (no tokens here)
        return AuthResponse.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .firstName(savedUser.getFirstName())
                .lastName(savedUser.getLastName())
                .role(savedUser.getRole())
                .message("Registered successfully")
                .build();
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    /**
     * Validates credentials, generates fresh tokens, and sets them as cookies.
     *
     * authenticationManager.authenticate() does the heavy lifting:
     *   - Calls UserDetailsService.loadUserByUsername(email)
     *   - Compares the raw password against the stored BCrypt hash
     *   - Throws BadCredentialsException if wrong (Spring Security handles this)
     */
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {

        // 1. Authenticate — throws exception automatically if credentials are wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. If we get here, credentials are valid — load the full user from DB
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // 3. Generate fresh tokens on every login
        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        // 4. Rotate refresh token: replace old token in DB with the new one
        //    This is "refresh token rotation" — old tokens become invalid immediately
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        // 5. Set tokens as HttpOnly cookies
        addAccessTokenCookie(response, accessToken);
        addRefreshTokenCookie(response, refreshToken);

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .message("Login successful")
                .build();
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────

    /**
     * Issues a new access token using the refresh token from the cookie.
     *
     * Flow:
     *   1. Read the refreshToken cookie
     *   2. Extract email from it
     *   3. Load user from DB
     *   4. Check the token matches what we stored (prevents reuse of stolen tokens)
     *   5. Issue new access token + rotate the refresh token
     */
    public AuthResponse refreshToken(HttpServletRequest request, HttpServletResponse response) {

        // 1. Read the refresh token from cookie
        String refreshToken = extractTokenFromCookie(request, "refreshToken");
        if (refreshToken == null) {
            throw new IllegalStateException("No refresh token found in cookies");
        }

        // 2. Extract email from the refresh token
        String email = jwtService.extractEmail(refreshToken);

        // 3. Load user from DB
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // 4. Validate: token must be valid AND match what's stored in DB
        //    If someone steals a refresh token and we rotate it, the old one won't match
        if (!jwtService.isTokenValid(refreshToken, user) ||
            !refreshToken.equals(user.getRefreshToken())) {
            throw new IllegalStateException("Invalid or expired refresh token");
        }

        // 5. Generate new tokens
        String newAccessToken  = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user); // rotate

        // 6. Save the new refresh token to DB, invalidating the old one
        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        // 7. Set new cookies
        addAccessTokenCookie(response, newAccessToken);
        addRefreshTokenCookie(response, newRefreshToken);

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .message("Token refreshed successfully")
                .build();
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    /**
     * Clears the refresh token from DB and removes both cookies from the browser.
     *
     * Clearing cookies means setting them to expired with empty value.
     * This tells the browser to delete them immediately.
     */
    public void logout(HttpServletRequest request, HttpServletResponse response) {

        String refreshToken = extractTokenFromCookie(request, "refreshToken");

        if (refreshToken != null) {
            String email = jwtService.extractEmail(refreshToken);
            userRepository.findByEmail(email).ifPresent(user -> {
                user.setRefreshToken(null); // remove from DB — token can no longer be refreshed
                userRepository.save(user);
            });
        }

        // Tell the browser to delete both cookies by setting Max-Age=0
        clearCookie(response, "accessToken");
        clearCookie(response, "refreshToken");
    }

    // ── Get Current User Profile ──────────────────────────────────────────────

    /**
     * Returns the profile of the currently authenticated user.
     * The email is extracted from the SecurityContext by the controller
     * (Spring puts it there after JwtAuthFilter validates the token).
     */
    public UserProfileResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }

    // ── Cookie Helpers ────────────────────────────────────────────────────────

    /**
     * Sets the access token as an HttpOnly cookie.
     *
     * Key cookie attributes:
     *  - HttpOnly: JavaScript cannot read this cookie (XSS protection)
     *  - Path=/: cookie is sent with every request to this domain
     *  - MaxAge: matches the token's own expiry (in seconds, not ms)
     *  - SameSite=Strict: cookie is only sent with same-site requests (CSRF protection)
     */
    private void addAccessTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("accessToken", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) (accessTokenExpiration / 1000)); // convert ms → seconds
        // cookie.setSecure(true); // uncomment in production (requires HTTPS)
        response.addCookie(cookie);

        // SameSite attribute isn't supported by the Cookie class directly,
        // so we add it via the Set-Cookie header manually
        response.addHeader("Set-Cookie",
            "accessToken=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age="
            + (accessTokenExpiration / 1000));
    }

    /**
     * Sets the refresh token as an HttpOnly cookie with a longer MaxAge.
     * Path is restricted to /api/auth/refresh so it's only sent to the refresh endpoint.
     */
    private void addRefreshTokenCookie(HttpServletResponse response, String token) {
        response.addHeader("Set-Cookie",
            "refreshToken=" + token + "; Path=/api/auth/refresh; HttpOnly; SameSite=Strict; Max-Age="
            + (refreshTokenExpiration / 1000));
    }

    /**
     * Clears a cookie by setting it to empty with Max-Age=0.
     * The browser interprets Max-Age=0 as "delete this cookie now".
     */
    private void clearCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0); // instant expiry = browser deletes it
        response.addCookie(cookie);
    }

    /**
     * Reads a specific cookie value from the incoming request.
     */
    private String extractTokenFromCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> cookieName.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
