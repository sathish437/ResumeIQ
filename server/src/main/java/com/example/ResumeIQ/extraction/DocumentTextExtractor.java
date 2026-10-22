package com.example.ResumeIQ.extraction;

public interface DocumentTextExtractor {

    boolean supports(DocumentType type);

    ExtractedDocument extract(ValidatedDocument document);
}
