package com.example.ResumeIQ.extraction;

/**
 * Text extracted from a single PDF page.
 *
 * @param pageNumber 1-based page number
 * @param text       extracted page text
 */
public record PdfPageSegment(int pageNumber, String text) {
}
