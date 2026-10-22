package com.example.ResumeIQ.extraction;

import java.util.List;

/**
 * Ordered text segments extracted from a document. PDFs expose page segments;
 * DOCX files expose paragraph segments. The unused collection is {@code null}.
 */
public record ExtractedDocument(
        DocumentType type,
        List<PdfPageSegment> pages,
        List<DocxParagraphSegment> paragraphs) {

    public static ExtractedDocument pdf(List<PdfPageSegment> pages) {
        return new ExtractedDocument(DocumentType.PDF, List.copyOf(pages), null);
    }

    public static ExtractedDocument docx(List<DocxParagraphSegment> paragraphs) {
        return new ExtractedDocument(DocumentType.DOCX, null, List.copyOf(paragraphs));
    }

    public int characterCount() {
        if (type == DocumentType.PDF) {
            return pages.stream().mapToInt(segment -> segment.text().length()).sum();
        }
        return paragraphs.stream().mapToInt(segment -> segment.text().length()).sum();
    }
}
