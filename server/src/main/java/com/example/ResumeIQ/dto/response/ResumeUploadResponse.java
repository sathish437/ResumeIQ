package com.example.ResumeIQ.dto.response;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

/**
 * Extracted resume content and metadata for an uploaded and stored resume.
 */
@Schema(name = "ResumeUploadResponse", description = "Extracted resume content and metadata for an uploaded and stored resume")
public record ResumeUploadResponse(
        @Schema(description = "Identifier to pass to the ask endpoint",
                example = "0f8b9a6c-1d2e-4f3a-9c7b-5d6e7f8a9b0c")
        String resumeId,

        @Schema(description = "Original file name", example = "resume.pdf")
        String filename,

        @Schema(description = "Detected document type", example = "PDF")
        String fileType,

        @Schema(description = "Processing status", example = "SUCCESS")
        String status,

        @Schema(description = "Number of extracted characters", example = "1532")
        int characterCount,

        @Schema(description = "Number of extracted segments; pages for PDF, paragraphs for DOCX",
                example = "3")
        int segmentCount,

        @Schema(description = "References that can be cited when answering questions",
                example = "[\"Page 1\", \"Page 2\"]")
        List<String> references,

        @Schema(description = "Complete extracted resume text", example = "Jane Doe\nJava Developer")
        String text,

        @JsonInclude(JsonInclude.Include.NON_NULL)
        @Schema(description = "Extracted text grouped by page, where applicable")
        List<ResumePageResponse> pages,

        @Schema(description = "Time the resume was stored", example = "2026-10-21T10:15:30Z")
        Instant createdAt) {

    public static ResumeUploadResponse from(ResumeDocument resume) {
        List<ResumePageResponse> pages = "PDF".equalsIgnoreCase(resume.fileType())
                ? resume.segments().stream()
                        .map(segment -> new ResumePageResponse(segment.index(), segment.text()))
                        .toList()
                : null;

        return new ResumeUploadResponse(
                resume.id(),
                resume.filename(),
                resume.fileType(),
                resume.status(),
                resume.characterCount(),
                resume.segments().size(),
                resume.segments().stream().map(ResumeSegment::reference).toList(),
                resume.text(),
                pages,
                resume.createdAt());
    }
}
