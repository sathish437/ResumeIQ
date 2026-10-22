package com.example.ResumeIQ.dto.response;

import java.util.List;

/**
 * Structured output schema requested from Spring AI ChatClient for resume Q&A.
 */
public record ResumeAskStructuredOutput(
        String answer,
        List<ResumeSource> sources,
        boolean insufficientEvidence
) {
}
