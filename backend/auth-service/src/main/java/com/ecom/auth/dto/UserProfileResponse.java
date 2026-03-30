package com.ecom.auth.dto;

import com.ecom.auth.model.Role;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * DTO for the GET /api/auth/me endpoint.
 *
 * When a logged-in user wants to fetch their own profile, we return this.
 * It includes more detail than AuthResponse (e.g., createdAt timestamp)
 * but still omits sensitive fields like password and refreshToken.
 *
 * Rule of thumb: never let a raw User entity leave the service layer.
 * Always map to a DTO so you control exactly what gets serialized to JSON.
 */
@Data
@Builder
public class UserProfileResponse {

    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;

    // ISO-8601 timestamp (e.g., "2026-03-30T15:48:00Z") — when the account was created
    private Instant createdAt;
}
