package com.example.ResumeIQ.extraction;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

public enum DocumentType {

    PDF(".pdf", "application/pdf"),
    DOCX(".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final String extension;
    private final String mediaType;

    DocumentType(String extension, String mediaType) {
        this.extension = extension;
        this.mediaType = mediaType;
    }

    public String extension() {
        return extension;
    }

    public String mediaType() {
        return mediaType;
    }

    public static Optional<DocumentType> fromFilename(String filename) {
        if (filename == null) {
            return Optional.empty();
        }
        String lowerCaseName = filename.toLowerCase(Locale.ROOT);
        return Arrays.stream(values())
                .filter(type -> lowerCaseName.endsWith(type.extension))
                .findFirst();
    }
}
