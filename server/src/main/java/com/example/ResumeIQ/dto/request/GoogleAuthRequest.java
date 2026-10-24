package com.example.ResumeIQ.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * Request payload containing the Google ID token credential.
 */
public record GoogleAuthRequest(
        @Schema(description = "Google ID token credential issued by Google Identity Services", requiredMode = Schema.RequiredMode.REQUIRED)
        @NotBlank(message = "Google credential token must not be blank")
        @JsonAlias({"idToken", "token"})
        String credential
) {
    public String getEffectiveToken() {
        return credential != null ? credential.strip() : null;
    }
}
