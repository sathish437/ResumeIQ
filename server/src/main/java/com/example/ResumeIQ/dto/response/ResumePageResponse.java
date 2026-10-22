package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Extracted text for a single page of a document.
 *
 * @param pageNumber 1-based page number
 * @param text extracted text of the page
 */
@Schema(name = "ResumePageResponse", description = "Extracted text for a single page")
public record ResumePageResponse(
        @Schema(description = "1-based page number", example = "1")
        int pageNumber,

        @Schema(description = "Extracted text of the page", example = "Jane Doe\nJava Developer")
        String text) {
}
