package com.example.ResumeIQ.controller;

import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.dto.request.GoogleAuthRequest;
import com.example.ResumeIQ.dto.response.AuthResponse;
import com.example.ResumeIQ.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Optional;

/**
 * REST controller for Google OAuth authentication, session validation, and logout.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Google Sign-In, Session Management, and User Profile")
public class AuthController {

    public static final String SESSION_COOKIE_NAME = "resumeiq_session";
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/google")
    @Operation(summary = "Authenticate with Google", description = "Verifies Google ID token, provisions or links user, and issues a session")
    public ResponseEntity<AuthResponse> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest httpRequest) {

        AuthResponse authResponse = authService.authenticateWithGoogle(request.getEffectiveToken());

        if (!authResponse.authenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(authResponse);
        }

        boolean isSecure = httpRequest.isSecure();
        ResponseCookie cookie = ResponseCookie.from(SESSION_COOKIE_NAME, authResponse.token())
                .httpOnly(true)
                .secure(isSecure)
                .path("/")
                .maxAge(Duration.ofDays(AuthService.SESSION_EXPIRY_DAYS))
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(authResponse);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile", description = "Validates the session token from header or cookie")
    public ResponseEntity<AuthResponse> getCurrentUser(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            HttpServletRequest httpRequest) {

        String token = resolveToken(authHeader, httpRequest);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.unauthenticated("No active authenticated session found."));
        }

        Optional<AppUser> userOpt = authService.validateSession(token);
        if (userOpt.isEmpty()) {
            ResponseCookie clearCookie = ResponseCookie.from(SESSION_COOKIE_NAME, "")
                    .httpOnly(true)
                    .path("/")
                    .maxAge(0)
                    .sameSite("Lax")
                    .build();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                    .body(AuthResponse.unauthenticated("Session has expired or is invalid. Please sign in again."));
        }

        AppUser user = userOpt.get();
        return ResponseEntity.ok(AuthResponse.success(token, authService.toProfile(user)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Sign out", description = "Invalidates the active session and clears the session cookie")
    public ResponseEntity<AuthResponse> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader,
            HttpServletRequest httpRequest) {

        String token = resolveToken(authHeader, httpRequest);
        if (token != null) {
            authService.logout(token);
        }

        ResponseCookie clearCookie = ResponseCookie.from(SESSION_COOKIE_NAME, "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body(AuthResponse.unauthenticated("Successfully signed out."));
    }

    private String resolveToken(String authHeader, HttpServletRequest request) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).strip();
            if (!token.isEmpty()) {
                return token;
            }
        }

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (SESSION_COOKIE_NAME.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                    return cookie.getValue().strip();
                }
            }
        }

        return null;
    }
}
