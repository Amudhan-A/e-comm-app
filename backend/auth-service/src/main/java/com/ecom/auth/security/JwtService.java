package com.ecom.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JwtService handles all JWT (JSON Web Token) operations:
 *   1. Generating access tokens (short-lived, 15 min)
 *   2. Generating refresh tokens (long-lived, 7 days)
 *   3. Validating tokens and extracting claims
 *
 * What is a JWT?
 *   A JWT is a self-contained string split into 3 parts: header.payload.signature
 *   - Header: algorithm used (HS256)
 *   - Payload: the "claims" — data embedded in the token (userId, email, role, expiry)
 *   - Signature: HMAC hash of header+payload using our secret key
 *
 *   Because we sign every token with our secret key, we can verify later
 *   that the token was genuinely issued by us and hasn't been tampered with.
 *   No database lookup needed to validate — that's the "stateless" advantage.
 */
@Service
public class JwtService {

    // Secret key loaded from application.properties — NEVER hardcode this
    @Value("${jwt.secret}")
    private String secretKey;

    // Access token expiry in milliseconds (default: 15 minutes = 900_000 ms)
    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    // Refresh token expiry in milliseconds (default: 7 days = 604_800_000 ms)
    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    // ── Token Generation ──────────────────────────────────────────────────────

    /**
     * Generates an access token for the given user.
     * The token embeds the user's email (as "subject") and their role as a custom claim.
     */
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> extraClaims = new HashMap<>();
        // Embed the user's role in the token so the Gateway can read it
        // without calling the auth-service for every request
        extraClaims.put("role", userDetails.getAuthorities()
                .iterator().next().getAuthority());
        return buildToken(extraClaims, userDetails, accessTokenExpiration);
    }

    /**
     * Generates a refresh token for the given user.
     * Refresh tokens carry no extra claims — they are only used to get new access tokens.
     */
    public String generateRefreshToken(UserDetails userDetails) {
        return buildToken(new HashMap<>(), userDetails, refreshTokenExpiration);
    }

    /**
     * Core token builder — combines claims, subject, timestamps, and signature.
     */
    private String buildToken(Map<String, Object> extraClaims,
                               UserDetails userDetails,
                               long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())       // username = email
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // HMAC-SHA256
                .compact(); // produces the final "header.payload.signature" string
    }

    // ── Token Validation ──────────────────────────────────────────────────────

    /**
     * Returns true if:
     *   1. The email embedded in the token matches the given user's email, AND
     *   2. The token has not expired yet
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String email = extractEmail(token);
        return email.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // ── Claims Extraction ─────────────────────────────────────────────────────

    /**
     * Extracts the email (stored as the JWT "subject") from the token.
     */
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Generic claim extractor — takes a function that picks which claim to return.
     * Example: extractClaim(token, Claims::getSubject) returns the subject (email).
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parses and verifies the token signature using our secret key.
     * Throws an exception if the token is invalid or tampered with.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Converts the Base64-encoded secret string from application.properties
     * into a cryptographic Key object that the JJWT library can use.
     */
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
