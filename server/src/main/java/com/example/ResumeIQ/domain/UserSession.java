package com.example.ResumeIQ.domain;

import java.time.Instant;

/**
 * Domain entity representing an authenticated session.
 */
public record UserSession(
        String token,
        String userId,
        Instant createdAt,
        Instant expiresAt
) {
    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}
