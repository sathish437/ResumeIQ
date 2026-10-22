package com.example.ResumeIQ.domain;

/**
 * A single traceable chunk of an uploaded resume.
 *
 * @param reference human readable locator, for example {@code Page 2} or
 *                  {@code Paragraph 5}; this is the marker the model is asked
 *                  to cite
 * @param index     1-based page number for PDFs, 0-based paragraph index for
 *                  DOCX files
 * @param text      extracted text of the segment
 */
public record ResumeSegment(String reference, int index, String text) {

    public static ResumeSegment page(int pageNumber, String text) {
        return new ResumeSegment("Page " + pageNumber, pageNumber, text);
    }

    public static ResumeSegment paragraph(int paragraphIndex, String text) {
        return new ResumeSegment("Paragraph " + paragraphIndex, paragraphIndex, text);
    }
}
