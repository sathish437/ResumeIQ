package com.example.ResumeIQ.domain;

import java.time.Instant;
import java.util.List;

/**
 * An uploaded resume and its extracted content as it is persisted.
 * Contains a mandatory or assigned user_id to enforce strict user-level data isolation.
 *
 * @param id             generated resume identifier
 * @param userId         internal user identifier who owns this resume
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
        String userId,
        String filename,
        String fileType,
        String status,
        int characterCount,
        List<ResumeSegment> segments,
        String text,
        Instant createdAt) {

    public ResumeDocument {
        segments = segments != null ? List.copyOf(segments) : List.of();
    }

    /**
     * Backward-compatible constructor for testing scenarios.
     */
    public ResumeDocument(
            String id,
            String filename,
            String fileType,
            String status,
            int characterCount,
            List<ResumeSegment> segments,
            String text,
            Instant createdAt) {
        this(id, null, filename, fileType, status, characterCount, segments, text, createdAt);
    }
}
