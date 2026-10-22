package com.example.ResumeIQ.extraction;

import com.example.ResumeIQ.exception.DocumentExtractionException;
import com.example.ResumeIQ.exception.NoExtractableTextException;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Extracts non-blank DOCX paragraphs in document order. Original paragraph
 * indexes are preserved even when blank paragraphs are skipped.
 */
@Component
public class DocxTextExtractor implements DocumentTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(DocxTextExtractor.class);

    @Override
    public boolean supports(DocumentType type) {
        return type == DocumentType.DOCX;
    }

    @Override
    public ExtractedDocument extract(ValidatedDocument document) {
        try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(document.content()))) {
            List<XWPFParagraph> allParagraphs = docx.getParagraphs();
            List<DocxParagraphSegment> paragraphs = new ArrayList<>();

            for (int index = 0; index < allParagraphs.size(); index++) {
                XWPFParagraph paragraph = allParagraphs.get(index);
                String text = paragraph.getText();
                if (text == null || text.isBlank()) {
                    continue;
                }
                paragraphs.add(new DocxParagraphSegment(index, text.strip(), paragraph.getStyle()));
            }

            if (paragraphs.isEmpty()) {
                throw new NoExtractableTextException(document.fieldName(),
                        ("No extractable text was found in '%s'. Image-only documents are not "
                                + "supported because OCR is not available.")
                                .formatted(document.fieldName()));
            }

            log.info("Extracted {} paragraph(s) from DOCX '{}'", paragraphs.size(),
                    document.originalFilename());
            return ExtractedDocument.docx(paragraphs);
        } catch (NoExtractableTextException ex) {
            throw ex;
        } catch (IOException | RuntimeException ex) {
            log.warn("Could not extract text from DOCX '{}'", document.originalFilename(), ex);
            throw new DocumentExtractionException(document.fieldName(),
                    "Could not extract text from '%s': the DOCX file is corrupt or unreadable."
                            .formatted(document.fieldName()));
        }
    }
}
