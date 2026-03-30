package com.ecom.auth.security;

import com.ecom.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

/**
 * JwtAuthFilter intercepts every incoming HTTP request and checks:
 * "Does this request carry a valid JWT access token in its cookies?"
 *
 * FIX for circular dependency:
 *   Previously this injected UserDetailsService, which is a @Bean defined
 *   inside SecurityConfig. Since SecurityConfig also injects JwtAuthFilter,
 *   Spring saw a cycle: SecurityConfig → JwtAuthFilter → UserDetailsService → SecurityConfig.
 *
 *   Solution: inject UserRepository directly. It has no dependency on SecurityConfig,
 *   so the cycle is broken cleanly.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository; // ← direct repo, NOT UserDetailsService

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Step 1: Extract JWT from the "accessToken" HttpOnly cookie
        String jwt = extractTokenFromCookie(request, "accessToken");

        // No cookie → skip filter, SecurityConfig will block protected routes
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Step 2: Extract email from token
        String email = jwtService.extractEmail(jwt);

        // Step 3: Only process if email was extracted and user isn't already authenticated
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Step 4: Load user directly from MongoDB (bypasses UserDetailsService)
            UserDetails userDetails = userRepository.findByEmail(email)
                    .orElse(null);

            if (userDetails == null) {
                filterChain.doFilter(request, response);
                return;
            }

            // Step 5: Validate the token against the loaded user
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // Step 6: Build Spring Security's authentication object
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Step 7: Register authentication in SecurityContext for this request
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Step 8: Continue down the filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Reads a specific cookie from the incoming request.
     * Returns null if the cookie doesn't exist.
     */
    private String extractTokenFromCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) return null;

        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
