package com.ecom.auth.dto;

import com.ecom.auth.model.Role;
import lombok.Builder;
import lombok.Data;

/**
 * DTO returned in the response body after a successful login or register.
 *
 * IMPORTANT: Notice there is NO accessToken or refreshToken field here.
 * Tokens are intentionally NOT returned in the JSON body.
 * Instead, they are set as HttpOnly cookies by the AuthController.
 *
 * Why HttpOnly cookies?
 *  - JavaScript running in the browser (including malicious XSS scripts)
 *    cannot read HttpOnly cookies, unlike tokens stored in localStorage.
 *  - The browser automatically sends cookies with every request,
 *    so the client code doesn't need to manually attach a header.
 *
 * This response body only carries user identity info so the frontend
 * knows who just logged in (e.g., to display "Welcome, Amudhan").
 */
@Data
@Builder
public class AuthResponse {

    private String userId;
    private String email;
    private String firstName;
    private String lastName;

    // Role tells the frontend which UI elements to show (e.g., admin dashboard)
    private Role role;

    // A human-readable message like "Login successful" or "Registered successfully"
    private String message;
}
