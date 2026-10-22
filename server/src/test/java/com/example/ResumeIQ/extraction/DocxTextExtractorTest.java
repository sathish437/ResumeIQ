package com.example.ResumeIQ.extraction;

import com.example.ResumeIQ.exception.DocumentExtractionException;
import com.example.ResumeIQ.exception.NoExtractableTextException;
import com.example.ResumeIQ.support.TestDocuments;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocxTextExtractorTest {

    private final DocxTextExtractor extractor = new DocxTextExtractor();

    @Test
    void supportsOnlyDocx() {
        assertThat(extractor.supports(DocumentType.DOCX)).isTrue();
        assertThat(extractor.supports(DocumentType.PDF)).isFalse();
    }

    @Test
    void extractsParagraphsInDocumentOrder() {
        ValidatedDocument document = document(TestDocuments.docx(
                "Jane Doe", "Java Developer", "Five years of experience"));

        ExtractedDocument extracted = extractor.extract(document);

        assertThat(extracted.type()).isEqualTo(DocumentType.DOCX);
        assertThat(extracted.pages()).isNull();
        assertThat(extracted.paragraphs())
                .extracting(DocxParagraphSegment::paragraphIndex)
                .containsExactly(0, 1, 2);
        assertThat(extracted.paragraphs())
                .extracting(DocxParagraphSegment::text)
                .containsExactly("Jane Doe", "Java Developer", "Five years of experience");
        assertThat(extracted.characterCount())
                .isEqualTo("Jane Doe".length() + "Java Developer".length()
                        + "Five years of experience".length());
    }

    @Test
    void skipsBlankParagraphsButKeepsOriginalIndexes() {
        ValidatedDocument document = document(TestDocuments.docx(
                "Jane Doe", "", "  ", "Java Developer"));

        ExtractedDocument extracted = extractor.extract(document);

        assertThat(extracted.paragraphs())
                .extracting(DocxParagraphSegment::paragraphIndex)
                .containsExactly(0, 3);
    }

    @Test
    void keepsHeadingStyle() {
        ValidatedDocument document = document(
                TestDocuments.docxWithHeading("Skills", "Java", "Spring Boot"));

        ExtractedDocument extracted = extractor.extract(document);

        assertThat(extracted.paragraphs()).hasSize(3);
        assertThat(extracted.paragraphs().get(0).text()).isEqualTo("Skills");
        assertThat(extracted.paragraphs().get(0).style()).isEqualTo("Heading1");
        assertThat(extracted.paragraphs().get(1).text()).isEqualTo("Java");
        assertThat(extracted.paragraphs().get(2).text()).isEqualTo("Spring Boot");
    }

    @Test
    void rejectsDocxWithoutExtractableText() {
        assertThatThrownBy(() -> extractor.extract(document(TestDocuments.blankDocx())))
                .isInstanceOf(NoExtractableTextException.class)
                .hasMessageContaining("OCR");
    }

    @Test
    void rejectsCorruptDocx() {
        assertThatThrownBy(() -> extractor.extract(document(TestDocuments.corruptDocx())))
                .isInstanceOf(DocumentExtractionException.class)
                .hasMessageContaining("corrupt");
    }

    private ValidatedDocument document(byte[] content) {
        return new ValidatedDocument(
                "resume", "resume.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                DocumentType.DOCX, content);
    }
}
