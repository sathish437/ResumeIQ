package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Supporting reference and evidence from the uploaded resume.
 */
@Schema(name = "ResumeSource", description = "Supporting reference and evidence from the uploaded resume")
public record ResumeSource(
        @Schema(description = "Segment reference, e.g. Page 1 or Paragraph 2", example = "Page 1")
        String reference,

        @Schema(description = "Relevant extracted resume text evidence", example = "Java Developer with 5 years experience")
        String evidence
) {
}
