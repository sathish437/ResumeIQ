package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Standard authentication response returned upon login, profile verification, and logout.
 */
public record AuthResponse(
        @Schema(description = "Whether the current session/request is authenticated")
        boolean authenticated,

        @Schema(description = "Application session token")
        String token,

        @Schema(description = "Authenticated user profile")
        UserProfileResponse user,

        @Schema(description = "Status or error message")
        String message
) {
    public static AuthResponse success(String token, UserProfileResponse user) {
        return new AuthResponse(true, token, user, "Authentication successful");
    }

    public static AuthResponse unauthenticated(String message) {
        return new AuthResponse(false, null, null, message);
    }
}
