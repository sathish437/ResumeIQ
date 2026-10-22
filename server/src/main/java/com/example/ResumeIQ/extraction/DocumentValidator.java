package com.example.ResumeIQ.extraction;

import com.example.ResumeIQ.config.UploadProperties;
import com.example.ResumeIQ.exception.DocumentTooLargeException;
import com.example.ResumeIQ.exception.DocumentValidationException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Validates uploads without trusting the client-provided content type or file
 * name. The detected format must match the declared file extension.
 */
@Component
public class DocumentValidator {

    private static final byte[] PDF_SIGNATURE = "%PDF-".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] ZIP_SIGNATURE = {'P', 'K', 3, 4};
    private static final String DOCX_CONTENT_TYPES_ENTRY = "[Content_Types].xml";
    private static final String DOCX_DOCUMENT_ENTRY = "word/document.xml";

    private final UploadProperties uploadProperties;

    public DocumentValidator(UploadProperties uploadProperties) {
        this.uploadProperties = uploadProperties;
    }

    public ValidatedDocument validate(MultipartFile file, String fieldName) {
        if (file == null) {
            throw new DocumentValidationException(fieldName,
                    "File '%s' is required.".formatted(fieldName));
        }
        if (file.isEmpty() || file.getSize() == 0) {
            throw new DocumentValidationException(fieldName,
                    "File '%s' is empty. Upload a non-empty PDF or DOCX document.".formatted(fieldName));
        }

        String filename = sanitizeFilename(file.getOriginalFilename());
        if (filename == null || filename.isBlank()) {
            throw new DocumentValidationException(fieldName,
                    "File '%s' must have a file name with a .pdf or .docx extension.".formatted(fieldName));
        }

        DocumentType declaredType = DocumentType.fromFilename(filename)
                .orElseThrow(() -> new DocumentValidationException(fieldName,
                        "Unsupported file type for '%s'. Only .pdf and .docx files are accepted."
                                .formatted(fieldName)));

        long maxBytes = uploadProperties.maxFileSize().toBytes();
        if (file.getSize() > maxBytes) {
            throw new DocumentTooLargeException(fieldName,
                    "File '%s' exceeds the maximum allowed size of %d MB."
                            .formatted(fieldName, uploadProperties.maxFileSize().toMegabytes()));
        }

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException ex) {
            throw new DocumentValidationException(fieldName,
                    "File '%s' could not be read.".formatted(fieldName));
        }

        if (content.length == 0) {
            throw new DocumentValidationException(fieldName,
                    "File '%s' is empty. Upload a non-empty PDF or DOCX document.".formatted(fieldName));
        }

        DocumentType detectedType = detectType(content)
                .orElseThrow(() -> new DocumentValidationException(fieldName,
                        ("File '%s' is not a valid PDF or DOCX document "
                                + "(file signature check failed).").formatted(fieldName)));

        if (detectedType != declaredType) {
            throw new DocumentValidationException(fieldName,
                    ("File '%s' has extension '%s' but its content is %s. "
                            + "Ensure the file extension matches its format.")
                            .formatted(fieldName, declaredType.extension(), detectedType));
        }

        return new ValidatedDocument(fieldName, filename, file.getContentType(), detectedType, content);
    }

    private String sanitizeFilename(String originalFilename) {
        if (originalFilename == null) {
            return null;
        }
        String normalized = originalFilename.replace('\\', '/');
        int lastSlash = normalized.lastIndexOf('/');
        if (lastSlash >= 0) {
            normalized = normalized.substring(lastSlash + 1);
        }
        return normalized.trim();
    }

    private Optional<DocumentType> detectType(byte[] content) {
        if (startsWith(content, PDF_SIGNATURE)) {
            return Optional.of(DocumentType.PDF);
        }
        if (startsWith(content, ZIP_SIGNATURE) && isDocxPackage(content)) {
            return Optional.of(DocumentType.DOCX);
        }
        return Optional.empty();
    }

    private boolean isDocxPackage(byte[] content) {
        boolean hasContentTypes = false;
        boolean hasDocument = false;
        try (InputStream input = new java.io.ByteArrayInputStream(content);
             ZipInputStream zip = new ZipInputStream(input)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (DOCX_CONTENT_TYPES_ENTRY.equals(entry.getName())) {
                    hasContentTypes = true;
                } else if (DOCX_DOCUMENT_ENTRY.equals(entry.getName())) {
                    hasDocument = true;
                }
                if (hasContentTypes && hasDocument) {
                    return true;
                }
            }
        } catch (IOException ex) {
            return false;
        }
        return false;
    }

    private boolean startsWith(byte[] content, byte[] signature) {
        if (content.length < signature.length) {
            return false;
        }
        for (int index = 0; index < signature.length; index++) {
            if (content[index] != signature[index]) {
                return false;
            }
        }
        return true;
    }
}
