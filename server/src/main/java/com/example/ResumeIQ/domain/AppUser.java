package com.example.ResumeIQ.domain;

import java.time.Instant;

/**
 * Domain entity representing an authenticated ResumeIQ user.
 */
public record AppUser(
        String id,
        String googleId,
        String email,
        String name,
        String pictureUrl,
        Instant createdAt,
        Instant lastLoginAt
) {
    public AppUser withLastLogin(Instant now, String updatedName, String updatedPictureUrl) {
        return new AppUser(
                this.id,
                this.googleId,
                this.email,
                updatedName != null && !updatedName.isBlank() ? updatedName : this.name,
                updatedPictureUrl != null && !updatedPictureUrl.isBlank() ? updatedPictureUrl : this.pictureUrl,
                this.createdAt,
                now
        );
    }
}
