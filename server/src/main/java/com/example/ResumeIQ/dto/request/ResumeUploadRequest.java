package com.example.ResumeIQ.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.web.multipart.MultipartFile;

/**
 * Raw request for the resume upload endpoint. The schema is used to document
 * the multipart body of the upload endpoint.
 */
@Schema(name = "ResumeUploadRequest", description = "Multipart upload with a resume file")
public record ResumeUploadRequest(
        @Schema(description = "Resume file (.pdf or .docx)",
                requiredMode = Schema.RequiredMode.REQUIRED,
                type = "string", format = "binary")
        MultipartFile resume) {
}
