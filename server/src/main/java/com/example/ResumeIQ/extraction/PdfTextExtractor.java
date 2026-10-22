package com.example.ResumeIQ.extraction;

import com.example.ResumeIQ.exception.DocumentExtractionException;
import com.example.ResumeIQ.exception.NoExtractableTextException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Extracts text page by page so callers keep page boundaries and page numbers.
 */
@Component
public class PdfTextExtractor implements DocumentTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(PdfTextExtractor.class);

    @Override
    public boolean supports(DocumentType type) {
        return type == DocumentType.PDF;
    }

    @Override
    public ExtractedDocument extract(ValidatedDocument document) {
        try (PDDocument pdf = Loader.loadPDF(document.content())) {
            List<PdfPageSegment> pages = new ArrayList<>();
            int pageCount = pdf.getNumberOfPages();

            for (int pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setStartPage(pageNumber);
                stripper.setEndPage(pageNumber);
                String text = stripper.getText(pdf);
                pages.add(new PdfPageSegment(pageNumber, text == null ? "" : text.strip()));
            }

            if (pages.stream().allMatch(page -> page.text().isBlank())) {
                throw new NoExtractableTextException(document.fieldName(),
                        ("No extractable text was found in '%s'. Scanned PDFs and image-only "
                                + "documents are not supported because OCR is not available.")
                                .formatted(document.fieldName()));
            }

            log.info("Extracted {} page(s) from PDF '{}'", pageCount, document.originalFilename());
            return ExtractedDocument.pdf(pages);
        } catch (NoExtractableTextException ex) {
            throw ex;
        } catch (InvalidPasswordException ex) {
            throw new DocumentExtractionException(document.fieldName(),
                    "PDF '%s' is password-protected and cannot be analyzed."
                            .formatted(document.fieldName()));
        } catch (IOException ex) {
            log.warn("Could not extract text from PDF '{}'", document.originalFilename(), ex);
            throw new DocumentExtractionException(document.fieldName(),
                    "Could not extract text from '%s': the PDF is corrupt or unreadable."
                            .formatted(document.fieldName()));
        }
    }
}
