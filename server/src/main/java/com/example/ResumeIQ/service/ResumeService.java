package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.example.ResumeIQ.dto.response.AnalysisStatus;
import com.example.ResumeIQ.dto.response.ResumeUploadResponse;
import com.example.ResumeIQ.exception.DocumentExtractionException;
import com.example.ResumeIQ.extraction.DocumentTextExtractor;
import com.example.ResumeIQ.extraction.DocumentType;
import com.example.ResumeIQ.extraction.DocumentValidator;
import com.example.ResumeIQ.extraction.DocxParagraphSegment;
import com.example.ResumeIQ.extraction.ExtractedDocument;
import com.example.ResumeIQ.extraction.PdfPageSegment;
import com.example.ResumeIQ.extraction.ValidatedDocument;
import com.example.ResumeIQ.repository.ResumeRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Accepts a resume upload, extracts its text with the existing extractors and
 * stores the result so it can be queried later. No AI call is made here.
 */
@Service
public class ResumeService {

    private static final String RESUME_FIELD = "resume";

    private final DocumentValidator documentValidator;
    private final Map<DocumentType, DocumentTextExtractor> extractors;
    private final ResumeRepository resumeRepository;
    private final ResumeSessionContext sessionContext;

    public ResumeService(DocumentValidator documentValidator,
                         List<DocumentTextExtractor> extractors,
                         ResumeRepository resumeRepository) {
        this(documentValidator, extractors, resumeRepository, new ResumeSessionContext());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ResumeService(DocumentValidator documentValidator,
                         List<DocumentTextExtractor> extractors,
                         ResumeRepository resumeRepository,
                         ResumeSessionContext sessionContext) {
        this.documentValidator = documentValidator;
        this.extractors = new EnumMap<>(DocumentType.class);
        for (DocumentTextExtractor extractor : extractors) {
            for (DocumentType type : DocumentType.values()) {
                if (extractor.supports(type)) {
                    this.extractors.put(type, extractor);
                }
            }
        }
        this.resumeRepository = resumeRepository;
        this.sessionContext = sessionContext;
    }

    public ResumeUploadResponse upload(MultipartFile file) {
        ValidatedDocument validated = documentValidator.validate(file, RESUME_FIELD);
        ExtractedDocument extracted = extract(validated);
        String fullText = joinText(extracted);

        ResumeDocument document = new ResumeDocument(
                UUID.randomUUID().toString(),
                validated.originalFilename(),
                extracted.type().name(),
                AnalysisStatus.SUCCESS.name(),
                fullText.length(),
                toSegments(extracted),
                fullText,
                Instant.now());

        resumeRepository.save(document);
        sessionContext.setRecentResumeId(document.id());
        return ResumeUploadResponse.from(document);
    }

    private ExtractedDocument extract(ValidatedDocument document) {
        DocumentTextExtractor extractor = extractors.get(document.type());
        if (extractor == null) {
            throw new DocumentExtractionException(document.fieldName(),
                    "No text extractor is available for file '%s'."
                            .formatted(document.fieldName()));
        }
        return extractor.extract(document);
    }

    private List<ResumeSegment> toSegments(ExtractedDocument extracted) {
        if (extracted.type() == DocumentType.PDF) {
            return extracted.pages().stream()
                    .map(this::toSegment)
                    .toList();
        }
        return extracted.paragraphs().stream()
                .map(this::toSegment)
                .toList();
    }

    private ResumeSegment toSegment(PdfPageSegment segment) {
        return ResumeSegment.page(segment.pageNumber(), segment.text());
    }

    private ResumeSegment toSegment(DocxParagraphSegment segment) {
        return ResumeSegment.paragraph(segment.paragraphIndex(), segment.text());
    }

    private String joinText(ExtractedDocument extracted) {
        List<String> parts = extracted.type() == DocumentType.PDF
                ? extracted.pages().stream().map(PdfPageSegment::text).toList()
                : extracted.paragraphs().stream().map(DocxParagraphSegment::text).toList();
        return String.join("\n", parts);
    }
}
