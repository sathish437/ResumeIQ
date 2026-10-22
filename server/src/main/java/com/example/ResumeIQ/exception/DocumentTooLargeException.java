package com.example.ResumeIQ.exception;

/**
 * Raised when an uploaded document exceeds the configured per-file limit.
 */
public class DocumentTooLargeException extends RuntimeException {

    private final String field;

    public DocumentTooLargeException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
