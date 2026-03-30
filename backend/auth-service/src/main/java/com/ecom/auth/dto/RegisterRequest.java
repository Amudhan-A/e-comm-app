package com.ecom.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for the POST /api/auth/register endpoint.
 *
 * This is what the client sends in the request body when creating a new account.
 * We never expose the User entity directly to the outside world — this DTO acts
 * as a controlled "gate" for incoming data, with validation rules attached.
 */
@Data // Lombok: generates getters, setters, equals, hashCode, toString
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    /**
     * @Size enforces a minimum password length at the API layer,
     * before the password is even hashed and saved to the database.
     */
    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must have uppercase, lowercase, number, and special character"
    )
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
