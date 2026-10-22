package com.example.ResumeIQ.extraction;

import com.example.ResumeIQ.config.UploadProperties;
import com.example.ResumeIQ.exception.DocumentTooLargeException;
import com.example.ResumeIQ.exception.DocumentValidationException;
import com.example.ResumeIQ.support.TestDocuments;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocumentValidatorTest {

    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final String DOCX_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private final DocumentValidator validator =
            new DocumentValidator(new UploadProperties(DataSize.ofMegabytes(10)));

    @Test
    void acceptsValidPdf() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, TestDocuments.pdf("Jane Doe"));

        ValidatedDocument document = validator.validate(file, "resume");

        assertThat(document.type()).isEqualTo(DocumentType.PDF);
        assertThat(document.originalFilename()).isEqualTo("resume.pdf");
        assertThat(document.fieldName()).isEqualTo("resume");
    }

    @Test
    void acceptsValidDocx() {
        MockMultipartFile file = new MockMultipartFile(
                "jobDescription", "job.docx", DOCX_CONTENT_TYPE,
                TestDocuments.docx("Senior Java Developer"));

        ValidatedDocument document = validator.validate(file, "jobDescription");

        assertThat(document.type()).isEqualTo(DocumentType.DOCX);
        assertThat(document.originalFilename()).isEqualTo("job.docx");
    }

    @Test
    void acceptsUppercaseExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "RESUME.PDF", "text/plain", TestDocuments.pdf("Jane Doe"));

        ValidatedDocument document = validator.validate(file, "resume");

        assertThat(document.type()).isEqualTo(DocumentType.PDF);
    }

    @Test
    void stripsClientProvidedPathFromFilename() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "C:\\fakepath\\resume.pdf", PDF_CONTENT_TYPE,
                TestDocuments.pdf("Jane Doe"));

        ValidatedDocument document = validator.validate(file, "resume");

        assertThat(document.originalFilename()).isEqualTo("resume.pdf");
    }

    @Test
    void rejectsMissingFile() {
        assertThatThrownBy(() -> validator.validate(null, "resume"))
                .isInstanceOfSatisfying(DocumentValidationException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("resume"))
                .hasMessageContaining("resume");
    }

    @Test
    void rejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, new byte[0]);

        assertThatThrownBy(() -> validator.validate(file, "resume"))
                .isInstanceOf(DocumentValidationException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void rejectsMissingExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume", PDF_CONTENT_TYPE, TestDocuments.pdf("Jane Doe"));

        assertThatThrownBy(() -> validator.validate(file, "resume"))
                .isInstanceOf(DocumentValidationException.class)
                .hasMessageContaining(".pdf")
                .hasMessageContaining(".docx");
    }

    @Test
    void rejectsUnsupportedExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.txt", "text/plain", TestDocuments.text("plain text"));

        assertThatThrownBy(() -> validator.validate(file, "resume"))
                .isInstanceOfSatisfying(DocumentValidationException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("resume"))
                .hasMessageContaining("Only .pdf and .docx");
    }

    @Test
    void rejectsContentThatDoesNotMatchPdfExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, TestDocuments.text("not a pdf"));

        assertThatThrownBy(() -> validator.validate(file, "resume"))
                .isInstanceOf(DocumentValidationException.class)
                .hasMessageContaining("valid PDF");
    }

    @Test
    void rejectsPdfContentRenamedToDocx() {
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.docx", DOCX_CONTENT_TYPE, TestDocuments.pdf("Jane Doe"));

        assertThatThrownBy(() -> validator.validate(file, "resume"))
                .isInstanceOf(DocumentValidationException.class)
                .hasMessageContaining("extension matches");
    }

    @Test
    void rejectsZipThatIsNotADocxPackage() {
        MockMultipartFile file = new MockMultipartFile(
                "jobDescription", "job.docx", DOCX_CONTENT_TYPE,
                TestDocuments.zipWithoutDocxEntries());

        assertThatThrownBy(() -> validator.validate(file, "jobDescription"))
                .isInstanceOf(DocumentValidationException.class)
                .hasMessageContaining("file signature check failed");
    }

    @Test
    void rejectsFileLargerThanConfiguredLimit() {
        DocumentValidator tinyLimitValidator =
                new DocumentValidator(new UploadProperties(DataSize.ofBytes(4)));
        MockMultipartFile file = new MockMultipartFile(
                "resume", "resume.pdf", PDF_CONTENT_TYPE, TestDocuments.pdf("Jane Doe"));

        assertThatThrownBy(() -> tinyLimitValidator.validate(file, "resume"))
                .isInstanceOf(DocumentTooLargeException.class)
                .hasMessageContaining("maximum allowed size");
    }
}
