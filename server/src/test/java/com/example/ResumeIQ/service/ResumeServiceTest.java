package com.example.ResumeIQ.service;

import com.example.ResumeIQ.config.UploadProperties;
import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.example.ResumeIQ.dto.response.ResumeUploadResponse;
import com.example.ResumeIQ.exception.DocumentExtractionException;
import com.example.ResumeIQ.exception.DocumentValidationException;
import com.example.ResumeIQ.extraction.DocumentValidator;
import com.example.ResumeIQ.extraction.DocxTextExtractor;
import com.example.ResumeIQ.extraction.PdfTextExtractor;
import com.example.ResumeIQ.repository.ResumeRepository;
import com.example.ResumeIQ.support.TestDocuments;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class ResumeServiceTest {

    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final String DOCX_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private final ResumeRepository resumeRepository = mock(ResumeRepository.class);

    private final ResumeService service = new ResumeService(
            new DocumentValidator(new UploadProperties(DataSize.ofMegabytes(10))),
            List.of(new PdfTextExtractor(), new DocxTextExtractor()),
            resumeRepository);

    @Test
    void storesPdfResumeWithPageReferences() {
        ResumeUploadResponse response = service.upload(pdf("Jane Doe\nJava Developer"));

        assertThat(response.status()).isEqualTo("SUCCESS");
        assertThat(response.filename()).isEqualTo("resume.pdf");
        assertThat(response.fileType()).isEqualTo("PDF");
        assertThat(response.segmentCount()).isEqualTo(1);
        assertThat(response.references()).containsExactly("Page 1");
        assertThat(response.characterCount()).isPositive();
        assertThat(response.resumeId()).isNotBlank();
        assertThat(response.createdAt()).isNotNull();
    }

    @Test
    void storesDocxResumeWithParagraphReferences() {
        ResumeUploadResponse response = service.upload(
                docx("Jane Doe", "Java Developer", "Spring Boot required"));

        assertThat(response.fileType()).isEqualTo("DOCX");
        assertThat(response.segmentCount()).isEqualTo(3);
        assertThat(response.references()).containsExactly("Paragraph 0", "Paragraph 1", "Paragraph 2");
    }

    @Test
    void persistsTheExtractedContentAndSegments() {
        service.upload(pdf("Jane Doe\nJava Developer"));

        ResumeDocument saved = captureSavedResume();
        assertThat(saved.text()).contains("Jane Doe").contains("Java Developer");
        assertThat(saved.characterCount()).isEqualTo(saved.text().length());
        assertThat(saved.fileType()).isEqualTo("PDF");
        assertThat(saved.segments())
                .extracting(ResumeSegment::reference)
                .containsExactly("Page 1");
        assertThat(saved.segments().get(0).text()).contains("Jane Doe");
    }

    @Test
    void generatesADistinctIdForEveryUpload() {
        String first = service.upload(pdf("Jane Doe")).resumeId();
        String second = service.upload(pdf("Jane Doe")).resumeId();

        assertThat(first).isNotBlank().isNotEqualTo(second);
    }

    @Test
    void returnsTheExtractedTextAndPagesInTheResponse() {
        ResumeUploadResponse response = service.upload(pdf("Jane Doe\nJava Developer"));

        assertThat(response.text()).contains("Jane Doe").contains("Java Developer");
        assertThat(response.pages()).hasSize(1);
        assertThat(response.pages().get(0).pageNumber()).isEqualTo(1);
        assertThat(response.pages().get(0).text()).contains("Jane Doe").contains("Java Developer");
        assertThat(response.characterCount()).isEqualTo(response.text().length());
    }

    @Test
    void returnsExtractedTextForDocxWithoutPages() {
        ResumeUploadResponse response = service.upload(
                docx("Jane Doe", "Java Developer", "Spring Boot required"));

        assertThat(response.text())
                .contains("Jane Doe")
                .contains("Java Developer")
                .contains("Spring Boot required");
        assertThat(response.pages()).isNull();
        assertThat(response.characterCount()).isEqualTo(response.text().length());
    }

    @Test
    void preservesMultiPagePdfTextAndPageSegments() {
        byte[] multiPagePdf = TestDocuments.pdfPages("Page 1 Content: Jane Doe", "Page 2 Content: Projects");
        ResumeUploadResponse response = service.upload(new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, multiPagePdf));

        assertThat(response.text())
                .contains("Page 1 Content: Jane Doe")
                .contains("Page 2 Content: Projects");
        assertThat(response.pages()).hasSize(2);
        assertThat(response.pages().get(0).pageNumber()).isEqualTo(1);
        assertThat(response.pages().get(0).text()).contains("Page 1 Content: Jane Doe");
        assertThat(response.pages().get(1).pageNumber()).isEqualTo(2);
        assertThat(response.pages().get(1).text()).contains("Page 2 Content: Projects");
        assertThat(response.characterCount()).isEqualTo(response.text().length());
    }

    @Test
    void rejectsUnsupportedExtension() {
        assertThatThrownBy(() -> service.upload(new MockMultipartFile(
                "resume", "resume.txt", "text/plain", TestDocuments.text("plain text"))))
                .isInstanceOfSatisfying(DocumentValidationException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("resume"));
    }

    @Test
    void rejectsSpoofedFileSignature() {
        assertThatThrownBy(() -> service.upload(new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, TestDocuments.text("not a pdf"))))
                .isInstanceOfSatisfying(DocumentValidationException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("resume"));
    }

    @Test
    void rejectsEmptyFile() {
        assertThatThrownBy(() -> service.upload(new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, new byte[0])))
                .isInstanceOfSatisfying(DocumentValidationException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("resume"));
    }

    @Test
    void rejectsOversizedUpload() {
        byte[] content = new byte[11 * 1024 * 1024];
        System.arraycopy("%PDF-".getBytes(java.nio.charset.StandardCharsets.US_ASCII), 0, content, 0, 5);

        assertThatThrownBy(() -> service.upload(new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, content)))
                .isInstanceOf(com.example.ResumeIQ.exception.DocumentTooLargeException.class);
    }

    @Test
    void failsForCorruptPdf() {
        assertThatThrownBy(() -> service.upload(new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, TestDocuments.corruptPdf())))
                .isInstanceOf(DocumentExtractionException.class)
                .hasMessageContaining("resume");
    }

    @Test
    void failsForPdfWithoutExtractableText() {
        assertThatThrownBy(() -> service.upload(new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, TestDocuments.blankPdf())))
                .isInstanceOf(DocumentExtractionException.class)
                .hasMessageContaining("OCR is not available");
    }

    @Test
    void failsForDocxWithoutExtractableText() {
        assertThatThrownBy(() -> service.upload(new MockMultipartFile(
                "resume", "resume.docx", DOCX_CONTENT_TYPE, TestDocuments.blankDocx())))
                .isInstanceOf(DocumentExtractionException.class);
    }

    private ResumeDocument captureSavedResume() {
        ArgumentCaptor<ResumeDocument> captor = ArgumentCaptor.forClass(ResumeDocument.class);
        verify(resumeRepository).save(captor.capture());
        return captor.getValue();
    }

    private MockMultipartFile pdf(String text) {
        return new MockMultipartFile("resume", "resume.pdf", PDF_CONTENT_TYPE,
                TestDocuments.pdf(text));
    }

    private MockMultipartFile docx(String... paragraphs) {
        return new MockMultipartFile("resume", "resume.docx", DOCX_CONTENT_TYPE,
                TestDocuments.docx(paragraphs));
    }
}
