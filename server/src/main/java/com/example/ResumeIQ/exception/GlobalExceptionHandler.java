package com.example.ResumeIQ.exception;

import com.example.ResumeIQ.dto.response.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.time.OffsetDateTime;

/**
 * Translates upload failures into a consistent error body. Full document
 * contents are never logged.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(DocumentValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(DocumentValidationException ex,
                                                             HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage(), ex.getField(), request);
    }

    @ExceptionHandler(DocumentTooLargeException.class)
    public ResponseEntity<ApiErrorResponse> handleTooLarge(DocumentTooLargeException ex,
                                                           HttpServletRequest request) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, ex.getMessage(), ex.getField(), request);
    }

    @ExceptionHandler(DocumentExtractionException.class)
    public ResponseEntity<ApiErrorResponse> handleExtraction(DocumentExtractionException ex,
                                                             HttpServletRequest request) {
        return error(HttpStatus.UNPROCESSABLE_CONTENT, ex.getMessage(), ex.getField(), request);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingPart(MissingServletRequestPartException ex,
                                                              HttpServletRequest request) {
        String field = ex.getRequestPartName();
        String message = "File '%s' is required.".formatted(field);
        return error(HttpStatus.BAD_REQUEST, message, field, request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParameter(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        String field = ex.getParameterName();
        String message = "Field '%s' is required.".formatted(field);
        return error(HttpStatus.BAD_REQUEST, message, field, request);
    }

    @ExceptionHandler(ResumeNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResumeNotFound(ResumeNotFoundException ex,
                                                                  HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), "resumeId", request);
    }

    @ExceptionHandler(AiServiceException.class)
    public ResponseEntity<ApiErrorResponse> handleAiService(AiServiceException ex,
                                                            HttpServletRequest request) {
        return error(HttpStatus.BAD_GATEWAY, ex.getMessage(), null, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableBody(HttpMessageNotReadableException ex,
                                                                  HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST,
                "The request body could not be read. Ensure it is valid JSON.",
                null, request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleUnsupportedMediaType(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "The request content type is not supported.", null, request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex,
                                                                HttpServletRequest request) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE,
                "The uploaded file exceeds the maximum allowed size. Each file must be 10 MB or smaller.",
                null, request);
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiErrorResponse> handleMultipart(MultipartException ex,
                                                            HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST,
                "The multipart request could not be read. Ensure 'resume' is uploaded "
                        + "as a file.",
                null, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        FieldError fieldError = ex.getBindingResult().getFieldError();
        String field = fieldError == null ? null : fieldError.getField();
        String message = fieldError == null ? "Request validation failed." : fieldError.getDefaultMessage();
        return error(HttpStatus.BAD_REQUEST, message, field, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex,
                                                             HttpServletRequest request) {
        log.error("Unexpected error while processing request {}", request.getRequestURI(), ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred while processing the request.", null, request);
    }

    private ResponseEntity<ApiErrorResponse> error(HttpStatus status, String message,
                                                   String field, HttpServletRequest request) {
        ApiErrorResponse body = new ApiErrorResponse(
                OffsetDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                field,
                request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
