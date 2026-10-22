package com.example.ResumeIQ.extraction;

/**
 * An uploaded document that passed validation. The content is kept in memory
 * only; uploads are never written to disk.
 */
public record ValidatedDocument(
        String fieldName,
        String originalFilename,
        String contentType,
        DocumentType type,
        byte[] content) {

    public ValidatedDocument {
        content = content.clone();
    }

    @Override
    public byte[] content() {
        return content.clone();
    }
}
