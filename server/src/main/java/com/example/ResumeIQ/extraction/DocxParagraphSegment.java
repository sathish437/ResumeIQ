package com.example.ResumeIQ.extraction;

/**
 * Text extracted from a single DOCX paragraph.
 *
 * @param paragraphIndex 0-based index in the original document
 * @param text           paragraph text
 * @param style          paragraph style name when present (for example "Heading1")
 */
public record DocxParagraphSegment(int paragraphIndex, String text, String style) {
}
