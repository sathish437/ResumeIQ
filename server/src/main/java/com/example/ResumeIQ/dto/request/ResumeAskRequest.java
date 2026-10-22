package com.example.ResumeIQ.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/**
 * A question about an uploaded resume. The resume is resolved from the
 * most recently uploaded resume for the current session.
 */
@Schema(name = "ResumeAskRequest", description = "Question about an uploaded resume")
@JsonIgnoreProperties(ignoreUnknown = true)
public record ResumeAskRequest(
        @NotBlank(message = "Question must not be blank.")
        @Schema(description = "Question to answer using the stored resume content",
                requiredMode = Schema.RequiredMode.REQUIRED,
                example = "What projects are mentioned in my resume?")
        String question) {
}
