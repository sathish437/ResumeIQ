package com.example.ResumeIQ.exception;

/**
 * Raised when a structurally valid document cannot be read or its text cannot
 * be extracted (for example a corrupt PDF body or malformed DOCX XML).
 */
public class DocumentExtractionException extends RuntimeException {

    private final String field;

    public DocumentExtractionException(String field, String message) {
        super(message);
        this.field = field;
    }

    public DocumentExtractionException(String field, String message, Throwable cause) {
        super(message, cause);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
