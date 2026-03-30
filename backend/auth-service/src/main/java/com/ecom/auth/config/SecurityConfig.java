package com.ecom.auth.config;

import com.ecom.auth.repository.UserRepository;
import com.ecom.auth.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig is the central security configuration for the entire auth-service.
 *
 * It does four things:
 *   1. Defines WHICH endpoints are public and which require a valid JWT
 *   2. Plugs our JwtAuthFilter into the filter chain
 *   3. Configures a stateless session (no server-side session storage)
 *   4. Provides shared beans: UserDetailsService, PasswordEncoder, AuthenticationManager
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserRepository userRepository;

    /**
     * THE most important bean — defines the security filter chain.
     *
     * Think of this as a list of rules applied to every incoming request, in order.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Disable CSRF protection.
            //    CSRF attacks exploit browser cookie auto-sending behavior.
            //    Since our API is stateless (no session) and consumed by our own
            //    React frontend, CSRF isn't a concern here. For form-based login
            //    apps it would be, but not for REST + JWT.
            .csrf(AbstractHttpConfigurer::disable)

            // 2. Define authorization rules — order matters: specific rules first
            .authorizeHttpRequests(auth -> auth
                // These endpoints are completely open — no token required
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/refresh",    // refresh token endpoint must be public
                    "/swagger-ui/**",       // Swagger UI
                    "/api-docs/**"          // OpenAPI JSON spec
                ).permitAll()

                // Admin-only routes (only ROLE_ADMIN users can access)
                .requestMatchers("/api/auth/admin/**").hasRole("ADMIN")

                // Every other request must carry a valid JWT cookie
                .anyRequest().authenticated()
            )

            // 3. Make the session stateless — Spring will NOT create or use HTTP sessions.
            //    Each request must be self-authenticated via its JWT cookie.
            //    This is a core property of a REST microservice.
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // 4. Register our custom AuthenticationProvider (DaoAuthenticationProvider)
            //    This tells Spring HOW to verify a username+password (used during login)
            .authenticationProvider(authenticationProvider())

            // 5. Insert our JwtAuthFilter BEFORE Spring's built-in
            //    UsernamePasswordAuthenticationFilter.
            //    This means: check the JWT cookie first, before anything else.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * UserDetailsService tells Spring HOW to load a user given a username (email).
     *
     * Spring Security calls this internally during authentication.
     * We load the user from MongoDB by email.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() ->
                    new UsernameNotFoundException("User not found with email: " + username)
                );
    }

    /**
     * DaoAuthenticationProvider wires together:
     *   - HOW to load users (UserDetailsService)
     *   - HOW to verify passwords (PasswordEncoder)
     *
     * Spring uses this during the login flow to check
     * if the raw password matches the stored BCrypt hash.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * BCryptPasswordEncoder — the industry standard for hashing passwords.
     *
     * BCrypt automatically:
     *   - Salts the password (prevents rainbow table attacks)
     *   - Is intentionally slow (adds a "work factor" to slow down brute force)
     *
     * NEVER store plain-text passwords. Always hash before saving to DB.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * AuthenticationManager is used in AuthService to programmatically
     * trigger authentication (i.e., validate email + password during login).
     *
     * Spring Boot 3 requires we explicitly expose this as a bean.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}
