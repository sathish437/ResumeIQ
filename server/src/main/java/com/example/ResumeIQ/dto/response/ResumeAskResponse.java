package com.example.ResumeIQ.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * Grounded answer about a stored resume with structured source evidence.
 */
@Schema(name = "ResumeAskResponse", description = "Answer grounded in an uploaded resume")
public record ResumeAskResponse(
        @Schema(description = "Identifier of the resume the answer is based on",
                example = "0f8b9a6c-1d2e-4f3a-9c7b-5d6e7f8a9b0c")
        String resumeId,

        @Schema(description = "Question that was asked",
                example = "What projects are mentioned in my resume?")
        String question,

        @Schema(description = "Answer produced from the stored resume content",
                example = "You worked on the billing platform [Page 2].")
        String answer,

        @Schema(description = "Structured sources with reference and evidence extracted from the resume")
        List<ResumeSource> sources,

        @Schema(description = "Source references cited by the answer, for example Page 2",
                example = "[\"Page 2\"]")
        List<String> sourceReferences,

        @Schema(description = "True when the resume does not contain sufficient evidence to answer",
                example = "false")
        boolean insufficientEvidence) {

    public ResumeAskResponse(String resumeId, String question, String answer, List<String> sourceReferences) {
        this(resumeId, question, answer,
                sourceReferences == null ? List.of() : sourceReferences.stream().map(ref -> new ResumeSource(ref, "")).toList(),
                sourceReferences == null ? List.of() : sourceReferences,
                false);
    }
}
