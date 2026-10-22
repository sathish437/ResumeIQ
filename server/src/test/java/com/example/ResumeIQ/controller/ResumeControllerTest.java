package com.example.ResumeIQ.controller;

import com.example.ResumeIQ.config.UploadConfig;
import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.example.ResumeIQ.exception.GlobalExceptionHandler;
import com.example.ResumeIQ.extraction.DocumentValidator;
import com.example.ResumeIQ.extraction.DocxTextExtractor;
import com.example.ResumeIQ.extraction.PdfTextExtractor;
import com.example.ResumeIQ.repository.ResumeRepository;
import com.example.ResumeIQ.service.ResumeAnalysisService;
import com.example.ResumeIQ.service.ResumeQaService;
import com.example.ResumeIQ.service.ResumeService;
import com.example.ResumeIQ.service.ResumeSessionContext;
import com.example.ResumeIQ.support.TestDocuments;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ResumeController.class)
@Import({ResumeService.class, ResumeQaService.class, ResumeAnalysisService.class,
        ResumeSessionContext.class, DocumentValidator.class, PdfTextExtractor.class,
        DocxTextExtractor.class, UploadConfig.class, GlobalExceptionHandler.class})
@ActiveProfiles("test")
@TestPropertySource(properties = "app.upload.max-file-size=64KB")
class ResumeControllerTest {

    private static final String PDF_CONTENT_TYPE = "application/pdf";
    private static final String DOCX_CONTENT_TYPE =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    private static final String UPLOAD_ENDPOINT = "/api/resumes/upload";
    private static final String ASK_ENDPOINT = "/api/resumes/ask";
    private static final String ANALYZE_ENDPOINT = "/api/resumes/analyze";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResumeSessionContext resumeSessionContext;

    @MockitoBean
    private ResumeRepository resumeRepository;

    @MockitoBean
    private com.example.ResumeIQ.repository.ResumeAnalysisRepository resumeAnalysisRepository;

    @MockitoBean(answers = Answers.RETURNS_DEEP_STUBS)
    private ChatClient chatClient;

    private final Map<String, ResumeDocument> savedDocuments = new ConcurrentHashMap<>();

    @BeforeEach
    void setupMocks() {
        resumeSessionContext.clear();
        savedDocuments.clear();

        doAnswer(invocation -> {
            ResumeDocument doc = invocation.getArgument(0);
            savedDocuments.put(doc.id(), doc);
            return null;
        }).when(resumeRepository).save(any(ResumeDocument.class));

        when(resumeRepository.findById(anyString())).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            if (savedDocuments.containsKey(id)) {
                return Optional.of(savedDocuments.get(id));
            }
            if ("resume-1".equals(id)) {
                return Optional.of(sampleResume("resume-1"));
            }
            return Optional.empty();
        });

        when(chatClient.prompt().system(anyString()).user(anyString()).call().content())
                .thenReturn("You worked on the billing platform [Page 2].");
    }

    @Test
    void storesAnUploadedPdfResumeAndReturnsItsMetadataAndExtractedText() throws Exception {
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(pdf("Jane Doe\nJava Developer")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").isNotEmpty())
                .andExpect(jsonPath("$.filename").value("resume.pdf"))
                .andExpect(jsonPath("$.fileType").value("PDF"))
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.characterCount").isNumber())
                .andExpect(jsonPath("$.segmentCount").value(1))
                .andExpect(jsonPath("$.references[0]").value("Page 1"))
                .andExpect(jsonPath("$.text", containsString("Jane Doe")))
                .andExpect(jsonPath("$.text", containsString("Java Developer")))
                .andExpect(jsonPath("$.pages[0].pageNumber").value(1))
                .andExpect(jsonPath("$.pages[0].text", containsString("Jane Doe")))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void storesAnUploadedDocxResumeAndReturnsItsTextWithoutPages() throws Exception {
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(docx("Jane Doe", "Java Developer")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.filename").value("resume.docx"))
                .andExpect(jsonPath("$.fileType").value("DOCX"))
                .andExpect(jsonPath("$.segmentCount").value(2))
                .andExpect(jsonPath("$.references[0]").value("Paragraph 0"))
                .andExpect(jsonPath("$.references[1]").value("Paragraph 1"))
                .andExpect(jsonPath("$.text", containsString("Jane Doe")))
                .andExpect(jsonPath("$.text", containsString("Java Developer")))
                .andExpect(jsonPath("$.pages").doesNotExist());
    }

    @Test
    void rejectsAnUploadWithoutAResumePart() throws Exception {
        mockMvc.perform(multipart(UPLOAD_ENDPOINT))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.field").value("resume"))
                .andExpect(jsonPath("$.message", containsString("required")))
                .andExpect(jsonPath("$.path").value(UPLOAD_ENDPOINT));
    }

    @Test
    void rejectsAnUploadWithAnUnsupportedExtension() throws Exception {
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(new MockMultipartFile("resume", "resume.txt", "text/plain",
                                TestDocuments.text("plain text"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("resume"))
                .andExpect(jsonPath("$.message", containsString("Only .pdf and .docx")));
    }

    @Test
    void rejectsAnOversizedUpload() throws Exception {
        byte[] content = new byte[70 * 1024];
        System.arraycopy("%PDF-".getBytes(StandardCharsets.US_ASCII), 0, content, 0, 5);

        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(new MockMultipartFile("resume", "resume.pdf", PDF_CONTENT_TYPE, content)))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.status").value(413))
                .andExpect(jsonPath("$.field").value("resume"));
    }

    @Test
    void rejectsACorruptResume() throws Exception {
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(new MockMultipartFile("resume", "resume.pdf", PDF_CONTENT_TYPE,
                                TestDocuments.corruptPdf())))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.field").value("resume"));
    }

    @Test
    void answersDirectAskRequestWithoutResumeIdInSession() throws Exception {
        MockHttpSession session = new MockHttpSession();

        byte[] multiPagePdf = TestDocuments.pdfPages("Jane Doe\nJava Developer", "Projects: billing platform");
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(new MockMultipartFile("resume", "resume.pdf", PDF_CONTENT_TYPE, multiPagePdf))
                        .session(session))
                .andExpect(status().isOk());

        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"What projects are mentioned in my resume?"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").isNotEmpty())
                .andExpect(jsonPath("$.question").value("What projects are mentioned in my resume?"))
                .andExpect(jsonPath("$.answer").value("You worked on the billing platform [Page 2]."))
                .andExpect(jsonPath("$.sourceReferences[0]").value("Page 2"));
    }

    @Test
    void directAskBeforeUploadReturnsMeaningfulError() throws Exception {
        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(new MockHttpSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"What projects are mentioned in my resume?"}"""))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.field").value("resumeId"))
                .andExpect(jsonPath("$.message", containsString("No resume has been uploaded for the current session")));
    }

    @Test
    void isolatesResumesBetweenDifferentSessions() throws Exception {
        MockHttpSession session1 = new MockHttpSession();
        MockHttpSession session2 = new MockHttpSession();

        String response1 = mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(pdf("Candidate One\nPython Developer"))
                        .session(session1))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String resumeId1 = com.jayway.jsonpath.JsonPath.read(response1, "$.resumeId");

        String response2 = mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(pdf("Candidate Two\nJava Developer"))
                        .session(session2))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String resumeId2 = com.jayway.jsonpath.JsonPath.read(response2, "$.resumeId");

        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(session1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"What skills are mentioned?"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").value(resumeId1));

        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(session2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"What skills are mentioned?"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").value(resumeId2));
    }

    @Test
    void rejectsABlankQuestion() throws Exception {
        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(new MockHttpSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"   "}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.field").value("question"));
    }

    @Test
    void rejectsAMalformedJsonBody() throws Exception {
        mockMvc.perform(post(ASK_ENDPOINT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void rejectsAnUnsupportedContentType() throws Exception {
        mockMvc.perform(post(ASK_ENDPOINT)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("resumeId=resume-1"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.status").value(415));
    }

    @Test
    void analyzesStoredResumeInCurrentSession() throws Exception {
        MockHttpSession session = new MockHttpSession();

        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(pdf("Jane Doe\nJava Developer\nSkills: Java, Spring Boot"))
                        .session(session))
                .andExpect(status().isOk());

        mockMvc.perform(post(ANALYZE_ENDPOINT)
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").isNotEmpty())
                .andExpect(jsonPath("$.professionalSummary").isNotEmpty())
                .andExpect(jsonPath("$.analyzedAt").isNotEmpty());
    }

    @Test
    void asksQuestionInTamilScriptAndReceivesStructuredResponse() throws Exception {
        MockHttpSession session = new MockHttpSession();
        byte[] multiPagePdf = TestDocuments.pdfPages("Jane Doe\nJava Developer", "Projects: billing platform");
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(new MockMultipartFile("resume", "resume.pdf", PDF_CONTENT_TYPE, multiPagePdf))
                        .session(session))
                .andExpect(status().isOk());

        when(chatClient.prompt().system(anyString()).user(anyString()).call().content())
                .thenReturn("உங்கள் ரெஸ்யூமில் திட்டங்கள்: billing platform [Page 2].");

        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"எனது ரெஸ்யூமில் என்ன திட்டங்கள் உள்ளன?"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.question").value("எனது ரெஸ்யூமில் என்ன திட்டங்கள் உள்ளன?"))
                .andExpect(jsonPath("$.answer", containsString("billing platform")))
                .andExpect(jsonPath("$.sourceReferences[0]").value("Page 2"))
                .andExpect(jsonPath("$.insufficientEvidence").value(false));
    }

    @Test
    void asksQuestionInThanglishAndReceivesStructuredResponse() throws Exception {
        MockHttpSession session = new MockHttpSession();
        byte[] multiPagePdf = TestDocuments.pdfPages("Jane Doe\nJava Developer", "Projects: billing platform");
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(new MockMultipartFile("resume", "resume.pdf", PDF_CONTENT_TYPE, multiPagePdf))
                        .session(session))
                .andExpect(status().isOk());

        when(chatClient.prompt().system(anyString()).user(anyString()).call().content())
                .thenReturn("Ungaloda resume la billing platform project mention panniruku [Page 2].");

        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"En resume la enna projects iruku?"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.question").value("En resume la enna projects iruku?"))
                .andExpect(jsonPath("$.answer", containsString("billing platform")))
                .andExpect(jsonPath("$.sourceReferences[0]").value("Page 2"))
                .andExpect(jsonPath("$.insufficientEvidence").value(false));
    }

    @Test
    void asksQuestionInMixedLanguageAndReceivesStructuredResponse() throws Exception {
        MockHttpSession session = new MockHttpSession();
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(pdf("Jane Doe\nJava Developer\nSkills: Java, Spring Boot"))
                        .session(session))
                .andExpect(status().isOk());

        when(chatClient.prompt().system(anyString()).user(anyString()).call().content())
                .thenReturn("Skills section improve panna cloud technologies add pannalam [Page 1].");

        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"En resume skills section improve panna enna changes venum?"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.question").value("En resume skills section improve panna enna changes venum?"))
                .andExpect(jsonPath("$.answer", containsString("improve panna")))
                .andExpect(jsonPath("$.sourceReferences[0]").value("Page 1"))
                .andExpect(jsonPath("$.insufficientEvidence").value(false));
    }

    @Test
    void asksEnglishFeedbackAndReceivesStructuredResponse() throws Exception {
        MockHttpSession session = new MockHttpSession();
        byte[] multiPagePdf = TestDocuments.pdfPages("Jane Doe\nJava Developer", "Projects: billing platform");
        mockMvc.perform(multipart(UPLOAD_ENDPOINT)
                        .file(new MockMultipartFile("resume", "resume.pdf", PDF_CONTENT_TYPE, multiPagePdf))
                        .session(session))
                .andExpect(status().isOk());

        when(chatClient.prompt().system(anyString()).user(anyString()).call().content())
                .thenReturn("""
                        Strengths:
                        - Solid Java backend background [Page 1].
                        
                        Important Issues:
                        - Projects section lacks quantifiable metrics [Page 2]. (Why it matters: Demonstrates business impact).
                        
                        Prioritized Next Steps:
                        - Add verified metrics if available.
                        """);

        mockMvc.perform(post(ASK_ENDPOINT)
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"Give me feedback on my resume."}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.question").value("Give me feedback on my resume."))
                .andExpect(jsonPath("$.answer", containsString("Strengths")))
                .andExpect(jsonPath("$.answer", containsString("Important Issues")))
                .andExpect(jsonPath("$.sources").isArray())
                .andExpect(jsonPath("$.sources[0].reference").value("Page 1"))
                .andExpect(jsonPath("$.sources[0].evidence").isNotEmpty())
                .andExpect(jsonPath("$.insufficientEvidence").value(false));
    }

    @Test
    void analyzeWithoutResumeReturns404() throws Exception {
        mockMvc.perform(post(ANALYZE_ENDPOINT)
                        .session(new MockHttpSession()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.field").value("resumeId"));
    }

    private ResumeDocument sampleResume(String id) {
        return new ResumeDocument(
                id,
                "resume.pdf",
                "PDF",
                "SUCCESS",
                42,
                List.of(ResumeSegment.page(1, "Jane Doe"), ResumeSegment.page(2, "billing platform")),
                "Jane Doe\nbilling platform",
                Instant.parse("2026-10-21T10:15:30Z"));
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
