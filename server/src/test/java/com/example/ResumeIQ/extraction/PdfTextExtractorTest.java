package com.example.ResumeIQ.extraction;

import com.example.ResumeIQ.exception.DocumentExtractionException;
import com.example.ResumeIQ.exception.NoExtractableTextException;
import com.example.ResumeIQ.support.TestDocuments;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PdfTextExtractorTest {

    private final PdfTextExtractor extractor = new PdfTextExtractor();

    @Test
    void supportsOnlyPdf() {
        assertThat(extractor.supports(DocumentType.PDF)).isTrue();
        assertThat(extractor.supports(DocumentType.DOCX)).isFalse();
    }

    @Test
    void extractsTextWithOneBasedPageNumbers() {
        ValidatedDocument document = document(TestDocuments.pdfPages(
                "Jane Doe\nJava Developer", "Experience\nSpring Boot"));

        ExtractedDocument extracted = extractor.extract(document);

        assertThat(extracted.type()).isEqualTo(DocumentType.PDF);
        assertThat(extracted.paragraphs()).isNull();
        assertThat(extracted.pages()).hasSize(2);
        assertThat(extracted.pages().get(0).pageNumber()).isEqualTo(1);
        assertThat(extracted.pages().get(0).text())
                .contains("Jane Doe")
                .contains("Java Developer");
        assertThat(extracted.pages().get(1).pageNumber()).isEqualTo(2);
        assertThat(extracted.pages().get(1).text())
                .contains("Experience")
                .contains("Spring Boot");
        assertThat(extracted.characterCount()).isGreaterThan(0);
    }

    @Test
    void rejectsPdfWithoutExtractableText() {
        assertThatThrownBy(() -> extractor.extract(document(TestDocuments.blankPdf())))
                .isInstanceOfSatisfying(NoExtractableTextException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("resume"))
                .hasMessageContaining("OCR");
    }

    @Test
    void rejectsCorruptPdf() {
        assertThatThrownBy(() -> extractor.extract(document(TestDocuments.corruptPdf())))
                .isInstanceOfSatisfying(DocumentExtractionException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("resume"))
                .hasMessageContaining("corrupt");
    }

    private ValidatedDocument document(byte[] content) {
        return new ValidatedDocument(
                "resume", "resume.pdf", "application/pdf", DocumentType.PDF, content);
    }
}
