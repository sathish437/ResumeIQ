package com.example.ResumeIQ.exception;

/**
 * Raised when the AI provider cannot produce an answer, for example when no
 * API key is configured or the upstream call fails.
 */
public class AiServiceException extends RuntimeException {

    public AiServiceException(String message) {
        super(message);
    }

    public AiServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
