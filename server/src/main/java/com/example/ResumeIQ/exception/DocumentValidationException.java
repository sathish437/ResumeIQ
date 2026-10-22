package com.example.ResumeIQ.exception;

/**
 * Raised when a request field fails validation, such as a missing, empty,
 * unsupported, mismatched, or plainly invalid file, or a missing or blank
 * plain-text field.
 */
public class DocumentValidationException extends RuntimeException {

    private final String field;

    public DocumentValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
