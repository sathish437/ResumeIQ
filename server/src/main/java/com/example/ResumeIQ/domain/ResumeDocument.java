package com.example.ResumeIQ.domain;

import java.time.Instant;
import java.util.List;

/**
 * An uploaded resume and its extracted content as it is persisted. The text and
 * the segments are kept so questions can be answered from stored content long
 * after the upload request has finished.
 *
 * @param id             generated resume identifier
 * @param filename       original file name of the upload
 * @param fileType       detected document type, {@code PDF} or {@code DOCX}
 * @param status         processing status of the upload
 * @param characterCount number of extracted characters
 * @param segments       ordered, citable segments of the document
 * @param text           full extracted text in document order
 * @param createdAt      time the resume was stored
 */
public record ResumeDocument(
        String id,
        String filename,
        String fileType,
        String status,
        int characterCount,
        List<ResumeSegment> segments,
        String text,
        Instant createdAt) {

    public ResumeDocument {
        segments = List.copyOf(segments);
    }
}
