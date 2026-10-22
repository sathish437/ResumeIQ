package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

/**
 * Consistent error payload returned by every failure path.
 */
@Schema(name = "ApiErrorResponse", description = "Error details for a failed request")
public record ApiErrorResponse(
        @Schema(description = "Time the error occurred", example = "2026-10-19T10:15:30Z")
        OffsetDateTime timestamp,
        @Schema(description = "HTTP status code", example = "400") int status,
        @Schema(description = "HTTP status reason", example = "Bad Request") String error,
        @Schema(description = "Human-readable error message") String message,
        @Schema(description = "Request field that caused the error", example = "resume")
        String field,
        @Schema(description = "Request path", example = "/api/resumes/analyze") String path) {
}
