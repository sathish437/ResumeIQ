package com.example.ResumeIQ.service;

import com.example.ResumeIQ.config.UploadProperties;
import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.dto.request.ResumeAskRequest;
import com.example.ResumeIQ.dto.request.SkillGapRequest;
import com.example.ResumeIQ.dto.response.ResumeUploadResponse;
import com.example.ResumeIQ.exception.ResumeNotFoundException;
import com.example.ResumeIQ.extraction.DocumentValidator;
import com.example.ResumeIQ.extraction.DocxTextExtractor;
import com.example.ResumeIQ.extraction.PdfTextExtractor;
import com.example.ResumeIQ.repository.ResumeAnalysisRepository;
import com.example.ResumeIQ.repository.ResumeRepository;
import com.example.ResumeIQ.support.TestDocuments;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserIsolationSecurityTest {

    private final AppUser userA = new AppUser(
            "user-a-1111",
            "google-sub-user-a",
            "alice@example.com",
            "Alice Johnson",
            "https://example.com/alice.jpg",
            Instant.now(),
            Instant.now()
    );

    private final AppUser userB = new AppUser(
            "user-b-2222",
            "google-sub-user-b",
            "bob@example.com",
            "Bob Miller",
            "https://example.com/bob.jpg",
            Instant.now(),
            Instant.now()
    );

    private final ResumeRepository resumeRepository = mock(ResumeRepository.class);
    private final ResumeAnalysisRepository analysisRepository = mock(ResumeAnalysisRepository.class);
    private final ChatClient chatClient = mock(ChatClient.class, Answers.RETURNS_DEEP_STUBS);

    private final ResumeSessionContext sessionContext = new ResumeSessionContext();

    private final ResumeService resumeService = new ResumeService(
            new DocumentValidator(new UploadProperties(DataSize.ofMegabytes(10))),
            List.of(new PdfTextExtractor(), new DocxTextExtractor()),
            resumeRepository,
            sessionContext
    );

    private final ResumeQaService resumeQaService = new ResumeQaService(
            chatClient,
            resumeRepository,
            sessionContext
    );

    private final ResumeAnalysisService resumeAnalysisService = new ResumeAnalysisService(
            chatClient,
            resumeRepository,
            analysisRepository,
            sessionContext,
            null
    );

    private final Map<String, ResumeDocument> inMemoryDb = new ConcurrentHashMap<>();

    @BeforeEach
    void setUp() {
        inMemoryDb.clear();
        sessionContext.clear();

        doAnswer(invocation -> {
            ResumeDocument doc = invocation.getArgument(0);
            inMemoryDb.put(doc.id(), doc);
            return null;
        }).when(resumeRepository).save(any(ResumeDocument.class));

        when(resumeRepository.findById(any(String.class))).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            return Optional.ofNullable(inMemoryDb.get(id));
        });

        when(resumeRepository.findByIdAndUserId(any(String.class), any(String.class))).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            String userId = invocation.getArgument(1);
            ResumeDocument doc = inMemoryDb.get(id);
            if (doc != null && userId != null && userId.equals(doc.userId())) {
                return Optional.of(doc);
            }
            return Optional.empty();
        });

        when(resumeRepository.findLatestByUserId(any(String.class))).thenAnswer(invocation -> {
            String userId = invocation.getArgument(0);
            return inMemoryDb.values().stream()
                    .filter(doc -> userId != null && userId.equals(doc.userId()))
                    .max((d1, d2) -> d1.createdAt().compareTo(d2.createdAt()));
        });

        when(resumeRepository.deleteByIdAndUserId(any(String.class), any(String.class))).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            String userId = invocation.getArgument(1);
            ResumeDocument doc = inMemoryDb.get(id);
            if (doc != null && userId != null && userId.equals(doc.userId())) {
                inMemoryDb.remove(id);
                return true;
            }
            return false;
        });
    }

    @Test
    @DisplayName("User A uploads Resume A and can retrieve their own resume")
    void userA_uploads_and_retrieves_own_resume() {
        MockMultipartFile fileA = new MockMultipartFile(
                "resume", "resumeA.pdf", "application/pdf",
                TestDocuments.pdf("Alice Senior Java Developer Kafka AWS")
        );

        ResumeUploadResponse uploadedA = resumeService.upload(fileA, userA);
        assertThat(uploadedA).isNotNull();
        assertThat(uploadedA.filename()).isEqualTo("resumeA.pdf");

        // Verify resume in repository belongs strictly to User A
        ResumeDocument storedA = inMemoryDb.get(uploadedA.resumeId());
        assertThat(storedA).isNotNull();
        assertThat(storedA.userId()).isEqualTo(userA.id());

        // User A can fetch their latest resume
        Optional<ResumeUploadResponse> latestA = resumeService.getLatestResume(userA);
        assertThat(latestA).isPresent();
        assertThat(latestA.get().resumeId()).isEqualTo(uploadedA.resumeId());
    }

    @Test
    @DisplayName("User B sees an empty result when they have not uploaded any resume")
    void userB_has_no_resumes_initially() {
        // User A uploads a resume
        MockMultipartFile fileA = new MockMultipartFile(
                "resume", "resumeA.pdf", "application/pdf",
                TestDocuments.pdf("Alice Resume Content")
        );
        resumeService.upload(fileA, userA);

        // User B has not uploaded anything -> latest resume must be empty
        Optional<ResumeUploadResponse> latestB = resumeService.getLatestResume(userB);
        assertThat(latestB).isEmpty();

        // Calling analyze for User B throws ResumeNotFoundException (triggers 404 in controller)
        assertThatThrownBy(() -> resumeAnalysisService.analyze(userB))
                .isInstanceOf(ResumeNotFoundException.class);

        // Calling ask for User B throws ResumeNotFoundException
        assertThatThrownBy(() -> resumeQaService.ask(new ResumeAskRequest("What is my experience?"), userB))
                .isInstanceOf(ResumeNotFoundException.class);
    }

    @Test
    @DisplayName("User B uploads Resume B and sees only Resume B, never Resume A")
    void userB_uploads_and_sees_only_own_resume() {
        // User A uploads
        MockMultipartFile fileA = new MockMultipartFile(
                "resume", "resumeA.pdf", "application/pdf",
                TestDocuments.pdf("Alice Backend Engineer")
        );
        ResumeUploadResponse uploadA = resumeService.upload(fileA, userA);

        // User B uploads
        MockMultipartFile fileB = new MockMultipartFile(
                "resume", "resumeB.pdf", "application/pdf",
                TestDocuments.pdf("Bob Frontend React Specialist")
        );
        ResumeUploadResponse uploadB = resumeService.upload(fileB, userB);

        // Verify User A sees only Resume A
        Optional<ResumeUploadResponse> latestA = resumeService.getLatestResume(userA);
        assertThat(latestA).isPresent();
        assertThat(latestA.get().resumeId()).isEqualTo(uploadA.resumeId());
        assertThat(latestA.get().filename()).isEqualTo("resumeA.pdf");

        // Verify User B sees only Resume B
        Optional<ResumeUploadResponse> latestB = resumeService.getLatestResume(userB);
        assertThat(latestB).isPresent();
        assertThat(latestB.get().resumeId()).isEqualTo(uploadB.resumeId());
        assertThat(latestB.get().filename()).isEqualTo("resumeB.pdf");
    }

    @Test
    @DisplayName("User B cannot retrieve User A's resume by guessing its ID")
    void userB_cannot_retrieve_userA_resume_by_id() {
        MockMultipartFile fileA = new MockMultipartFile(
                "resume", "resumeA.pdf", "application/pdf",
                TestDocuments.pdf("Confidential Alice Information")
        );
        ResumeUploadResponse uploadA = resumeService.upload(fileA, userA);

        // User B tries to fetch User A's resume by ID
        Optional<ResumeUploadResponse> breached = resumeService.getResumeByIdAndUser(uploadA.resumeId(), userB);
        assertThat(breached).isEmpty();
    }

    @Test
    @DisplayName("User B cannot delete User A's resume")
    void userB_cannot_delete_userA_resume() {
        MockMultipartFile fileA = new MockMultipartFile(
                "resume", "resumeA.pdf", "application/pdf",
                TestDocuments.pdf("Alice Resume")
        );
        ResumeUploadResponse uploadA = resumeService.upload(fileA, userA);

        // User B attempts to delete User A's resume
        boolean deletedByB = resumeService.deleteResume(uploadA.resumeId(), userB);
        assertThat(deletedByB).isFalse();

        // Resume A still exists for User A
        assertThat(inMemoryDb).containsKey(uploadA.resumeId());
    }

    @Test
    @DisplayName("User B cannot analyze, ask, or run skill gap against User A's resume ID")
    void userB_cannot_execute_ai_operations_on_userA_resume() {
        MockMultipartFile fileA = new MockMultipartFile(
                "resume", "resumeA.pdf", "application/pdf",
                TestDocuments.pdf("Alice Projects and Salary")
        );
        ResumeUploadResponse uploadA = resumeService.upload(fileA, userA);

        // User B tries to analyze User A's resume ID
        assertThatThrownBy(() -> resumeAnalysisService.analyze(uploadA.resumeId(), userB))
                .isInstanceOf(ResumeNotFoundException.class);

        // User B tries to ask question about User A's resume ID
        assertThatThrownBy(() -> resumeQaService.ask(uploadA.resumeId(), new ResumeAskRequest("What is salary?"), userB))
                .isInstanceOf(ResumeNotFoundException.class);

        // User B tries to run skill gap on User A's resume ID
        assertThatThrownBy(() -> resumeAnalysisService.analyzeSkillGap(uploadA.resumeId(), new SkillGapRequest("Java Dev"), userB))
                .isInstanceOf(ResumeNotFoundException.class);
    }

    @Test
    @DisplayName("Chat memory conversation IDs are strictly isolated per user and resume")
    void chat_memory_conversation_ids_are_isolated() {
        String convUserA = sessionContext.getConversationId(userA.id(), "123");
        String convUserB = sessionContext.getConversationId(userB.id(), "123");

        assertThat(convUserA).isEqualTo("user-user-a-1111:resume-123");
        assertThat(convUserB).isEqualTo("user-user-b-2222:resume-123");
        assertThat(convUserA).isNotEqualTo(convUserB);
    }

    @Test
    @DisplayName("Concurrent user sessions do not overwrite each other's active resume context")
    void concurrent_users_do_not_overwrite_session_context() {
        sessionContext.setRecentResumeId(userA.id(), "resume-A");
        sessionContext.setRecentResumeId(userB.id(), "resume-B");

        assertThat(sessionContext.getRecentResumeId(userA.id())).contains("resume-A");
        assertThat(sessionContext.getRecentResumeId(userB.id())).contains("resume-B");
    }
}
