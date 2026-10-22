package com.example.ResumeIQ.exception;

/**
 * Raised when a question refers to a resume identifier that is not stored,
 * or when no resume has been uploaded for the current session.
 */
public class ResumeNotFoundException extends RuntimeException {

    private final String resumeId;

    public ResumeNotFoundException(String resumeId) {
        super(resumeId == null
                ? "No resume has been uploaded for the current session. Please upload a resume before asking questions."
                : "No resume was found for id '%s'.".formatted(resumeId));
        this.resumeId = resumeId;
    }

    public ResumeNotFoundException(String resumeId, String message) {
        super(message);
        this.resumeId = resumeId;
    }

    public static ResumeNotFoundException noResumeUploaded() {
        return new ResumeNotFoundException(null,
                "No resume has been uploaded for the current session. Please upload a resume before asking questions.");
    }

    public String getResumeId() {
        return resumeId;
    }
}
