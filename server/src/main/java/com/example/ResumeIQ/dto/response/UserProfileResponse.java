package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Public profile data of an authenticated user.
 */
public record UserProfileResponse(
        @Schema(description = "Internal unique user identifier")
        String id,

        @Schema(description = "Verified email address")
        String email,

        @Schema(description = "Full name")
        String name,

        @Schema(description = "Profile picture avatar URL")
        String pictureUrl
) {}
