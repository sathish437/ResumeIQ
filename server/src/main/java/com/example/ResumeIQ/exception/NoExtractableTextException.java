package com.example.ResumeIQ.exception;

/**
 * Raised when a document is readable but contains no text that can be used for
 * analysis. OCR is intentionally not supported in this phase.
 */
public class NoExtractableTextException extends DocumentExtractionException {

    public NoExtractableTextException(String field, String message) {
        super(field, message);
    }
}
