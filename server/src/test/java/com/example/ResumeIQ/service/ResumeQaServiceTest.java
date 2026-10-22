package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import com.example.ResumeIQ.dto.request.ResumeAskRequest;
import com.example.ResumeIQ.dto.response.ResumeAskResponse;
import com.example.ResumeIQ.dto.response.ResumeSource;
import com.example.ResumeIQ.exception.AiServiceException;
import com.example.ResumeIQ.exception.DocumentValidationException;
import com.example.ResumeIQ.exception.ResumeNotFoundException;
import com.example.ResumeIQ.repository.ResumeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.client.ChatClient;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ResumeQaServiceTest {

    private final ResumeRepository resumeRepository = mock(ResumeRepository.class);
    private final ChatClient chatClient = mock(ChatClient.class, RETURNS_DEEP_STUBS);
    private final ResumeSessionContext sessionContext = new ResumeSessionContext();
    private final ResumeQaService service = new ResumeQaService(chatClient, resumeRepository, sessionContext);

    private final ResumeDocument resume = new ResumeDocument(
            "resume-1",
            "resume.pdf",
            "PDF",
            "SUCCESS",
            42,
            List.of(ResumeSegment.page(1, "Jane Doe\nJava Developer\nSkills: Java, Spring Boot"),
                    ResumeSegment.page(2, "Experience: 5 years\nProjects: billing platform")),
            "Jane Doe\nJava Developer\nSkills: Java, Spring Boot\nExperience: 5 years\nProjects: billing platform",
            Instant.parse("2026-10-21T10:15:30Z"));

    @BeforeEach
    void resetContext() {
        sessionContext.clear();
    }

    @Test
    void answersQuestionUsingTheStoredResume() {
        givenStoredResume(resume);
        modelAnswers("You worked on the billing platform [Page 2].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("What projects are mentioned in my resume?"));

        assertThat(response.resumeId()).isEqualTo("resume-1");
        assertThat(response.question()).isEqualTo("What projects are mentioned in my resume?");
        assertThat(response.answer()).isEqualTo("You worked on the billing platform [Page 2].");
        assertThat(response.sourceReferences()).containsExactly("Page 2");
    }

    @Test
    void directAskBeforeUploadThrowsMeaningfulError() {
        assertThatThrownBy(() -> service.ask(new ResumeAskRequest("What projects are mentioned?")))
                .isInstanceOf(ResumeNotFoundException.class)
                .hasMessageContaining("No resume has been uploaded for the current session");
    }

    @Test
    void questionsAboutProjectsSkillsAndExperienceUseUploadedResumeContent() {
        givenStoredResume(resume);
        modelAnswers("Skills include Java and Spring Boot [Page 1].");

        service.ask(new ResumeAskRequest("What skills and experience do I have?"));

        assertThat(lastUserMessage())
                .contains("[Page 1]")
                .contains("Skills: Java, Spring Boot")
                .contains("[Page 2]")
                .contains("Experience: 5 years")
                .contains("Projects: billing platform")
                .contains("What skills and experience do I have?");
    }

    @Test
    void sendsTheResumeContentWithReferenceMarkersToTheModel() {
        givenStoredResume(resume);
        modelAnswers("answer [Page 1]");

        service.ask(new ResumeAskRequest("Who is the candidate?"));

        assertThat(lastUserMessage())
                .contains("[Page 1]")
                .contains("Jane Doe")
                .contains("[Page 2]")
                .contains("Projects: billing platform")
                .contains("Who is the candidate?");
    }

    @Test
    void usesTheResumeQaSystemPrompt() {
        givenStoredResume(resume);
        modelAnswers("answer");

        service.ask(new ResumeAskRequest("What projects are mentioned?"));

        assertThat(lastSystemPrompt())
                .contains("Never invent skills")
                .contains("untrusted data")
                .contains("Thanglish")
                .contains("evidence");
    }

    @Test
    void keepsOnlyReferencesThatExistInTheAskedResume() {
        givenStoredResume(resume);
        modelAnswers("Something from [Page 9] and [Page 1].");

        ResumeAskResponse response = service.ask(new ResumeAskRequest("What is there?"));

        assertThat(response.sourceReferences()).containsExactly("Page 1");
    }

    @Test
    void returnsNoSourceReferencesWhenTheAnswerCitesNothing() {
        givenStoredResume(resume);
        modelAnswers("The resume does not mention any certification.");

        ResumeAskResponse response = service.ask(new ResumeAskRequest("Any certifications?"));

        assertThat(response.answer()).contains("does not mention");
        assertThat(response.sourceReferences()).isEmpty();
    }

    @Test
    void answersThanglishQuestions() {
        givenStoredResume(resume);
        modelAnswers("Nee oru billing platform project la work pannina [Page 2].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("Enna projects mention panninadhu?"));

        assertThat(response.answer()).contains("billing platform");
        assertThat(response.sourceReferences()).containsExactly("Page 2");

        assertThat(lastUserMessage()).contains("Enna projects mention panninadhu?");
    }

    @Test
    void neverMixesContentFromAnotherResume() {
        ResumeDocument other = new ResumeDocument(
                "resume-2", "other.pdf", "PDF", "SUCCESS", 10,
                List.of(ResumeSegment.page(1, "Confidential content of another candidate")),
                "Confidential content of another candidate",
                Instant.parse("2026-10-21T10:15:30Z"));
        when(resumeRepository.findById("resume-1")).thenReturn(Optional.of(resume));
        when(resumeRepository.findById("resume-2")).thenReturn(Optional.of(other));
        modelAnswers("answer");

        sessionContext.setCurrentResumeId("resume-1");
        service.ask(new ResumeAskRequest("Who is the candidate?"));

        verify(resumeRepository).findById("resume-1");
        verify(resumeRepository, never()).findById("resume-2");

        assertThat(lastUserMessage())
                .contains("Jane Doe")
                .doesNotContain("Confidential content of another candidate");
    }

    @Test
    void isolatesResumesBetweenDifferentSessions() {
        when(resumeRepository.findById("resume-1")).thenReturn(Optional.of(resume));
        sessionContext.setSessionResumeId("session-A", "resume-1");

        assertThat(sessionContext.getSessionResumeId("session-A")).contains("resume-1");
        assertThat(sessionContext.getSessionResumeId("session-B")).isEmpty();
    }

    @Test
    void rejectsABlankQuestion() {
        givenStoredResume(resume);

        assertThatThrownBy(() -> service.ask(new ResumeAskRequest("   ")))
                .isInstanceOfSatisfying(DocumentValidationException.class,
                        ex -> assertThat(ex.getField()).isEqualTo("question"));
    }

    @Test
    void rejectsAnUnknownResumeId() {
        when(resumeRepository.findById("missing")).thenReturn(Optional.empty());
        sessionContext.setCurrentResumeId("missing");

        assertThatThrownBy(() -> service.ask(new ResumeAskRequest("What projects?")))
                .isInstanceOfSatisfying(ResumeNotFoundException.class,
                        ex -> assertThat(ex.getResumeId()).isEqualTo("missing"));
    }

    @Test
    void doesNotCallTheModelForAnUnknownResumeId() {
        when(resumeRepository.findById("missing")).thenReturn(Optional.empty());
        sessionContext.setCurrentResumeId("missing");

        assertThatThrownBy(() -> service.ask(new ResumeAskRequest("What projects?")))
                .isInstanceOf(ResumeNotFoundException.class);

        verify(chatClient, never()).prompt();
    }

    @Test
    void reportsAiFailuresAsServiceErrors() {
        givenStoredResume(resume);
        when(chatClient.prompt().system(anyString()).user(anyString()).call().content())
                .thenThrow(new RuntimeException("upstream unavailable"));

        assertThatThrownBy(() -> service.ask(new ResumeAskRequest("What projects?")))
                .isInstanceOf(AiServiceException.class)
                .hasMessageContaining("unavailable");
    }

    @Test
    void reportsAnEmptyModelAnswerAsServiceError() {
        givenStoredResume(resume);
        modelAnswers("   ");

        assertThatThrownBy(() -> service.ask(new ResumeAskRequest("What projects?")))
                .isInstanceOf(AiServiceException.class);
    }

    @Test
    void returnsStructuredSourcesWithEvidence() {
        givenStoredResume(resume);
        modelAnswers("You worked on the billing platform [Page 2].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("What projects are mentioned?"));

        assertThat(response.sources()).isNotEmpty();
        assertThat(response.sources().get(0).reference()).isEqualTo("Page 2");
        assertThat(response.sources().get(0).evidence()).contains("billing platform");
        assertThat(response.insufficientEvidence()).isFalse();
    }

    @Test
    void flagsInsufficientEvidenceWhenInformationNotPresent() {
        givenStoredResume(resume);
        modelAnswers("The information about AWS certification is not available in the uploaded resume.");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("Are you AWS certified?"));

        assertThat(response.insufficientEvidence()).isTrue();
    }

    @Test
    void discardsFabricatedCitationsNotPresentInResume() {
        givenStoredResume(resume);
        modelAnswers("Something from [Page 99].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("What is on page 99?"));

        assertThat(response.sourceReferences()).isEmpty();
        assertThat(response.sources()).isEmpty();
    }

    @Test
    void answersTamilScriptFeedbackQuestionWithoutMarkingInsufficientEvidence() {
        givenStoredResume(resume);
        modelAnswers("உங்கள் ரெஸ்யூமில் உள்ள பலங்கள் மற்றும் குறைகள்: 1. Java, Spring Boot போன்ற வலுவான திறன்கள் உள்ளன [Page 1]. 2. Projects பகுதியில் quantitative metrics சேர்க்கலாம் [Page 2].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("எனது ரெஸ்யூமில் என்ன குறைகள் உள்ளன?"));

        assertThat(response.answer()).contains("உங்கள் ரெஸ்யூமில் உள்ள பலங்கள் மற்றும் குறைகள்");
        assertThat(response.sourceReferences()).contains("Page 1", "Page 2");
        assertThat(response.insufficientEvidence()).isFalse();
        assertThat(lastUserMessage()).contains("எனது ரெஸ்யூமில் என்ன குறைகள் உள்ளன?");
    }

    @Test
    void answersThanglishFeedbackQuestionsWithoutMarkingInsufficientEvidence() {
        givenStoredResume(resume);
        modelAnswers("Ungaloda resume la sila mistakes iruku: Projects section la metrics mention pannala [Page 2]. Strengths: Strong Java and Spring Boot foundation [Page 1].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("En resume la enna mistakes iruku?"));

        assertThat(response.answer()).contains("Ungaloda resume la sila mistakes iruku");
        assertThat(response.sourceReferences()).contains("Page 1", "Page 2");
        assertThat(response.insufficientEvidence()).isFalse();
        assertThat(lastUserMessage()).contains("En resume la enna mistakes iruku?");
    }

    @Test
    void answersMixedEnglishAndThanglishQuestions() {
        givenStoredResume(resume);
        modelAnswers("Skills section improve panna, advanced frameworks and cloud certifications add pannalam [Page 1].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("En resume skills section improve panna enna changes venum?"));

        assertThat(response.answer()).contains("Skills section improve panna");
        assertThat(response.sourceReferences()).contains("Page 1");
        assertThat(response.insufficientEvidence()).isFalse();
        assertThat(lastUserMessage()).contains("En resume skills section improve panna enna changes venum?");
    }

    @Test
    void answersEnglishFeedbackQuestionsWithoutMarkingInsufficientEvidence() {
        givenStoredResume(resume);
        modelAnswers("Resume feedback: Strengths include strong backend Java skills [Page 1]. Recommendations: Include latency improvement metrics for billing platform [Page 2].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("Give me feedback on my resume."));

        assertThat(response.answer()).contains("Resume feedback");
        assertThat(response.sourceReferences()).contains("Page 1", "Page 2");
        assertThat(response.insufficientEvidence()).isFalse();
    }

    @Test
    void flagsInsufficientEvidenceWhenTamilScriptAbsenceIsReported() {
        givenStoredResume(resume);
        modelAnswers("ரெஸ்யூமில் AWS சான்றிதழ் பற்றிய தகவல் இல்லை.");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("உங்களுக்கு AWS சான்றிதழ் உள்ளதா?"));

        assertThat(response.insufficientEvidence()).isTrue();
    }

    @Test
    void flagsInsufficientEvidenceWhenThanglishAbsenceIsReported() {
        givenStoredResume(resume);
        modelAnswers("Resume la AWS certification pathi mention pannala.");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("AWS certification iruka?"));

        assertThat(response.insufficientEvidence()).isTrue();
    }

    @Test
    void crossLanguageFollowUpPreservesConversationContext() {
        givenStoredResume(resume);
        modelAnswers("Billing platform project romba strong-ah iruku [Page 2].");

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("Idhula endha project strong-ah iruku?"));

        assertThat(response.answer()).contains("Billing platform");
        assertThat(response.sourceReferences()).contains("Page 2");
        assertThat(lastUserMessage()).contains("Idhula endha project strong-ah iruku?");
    }

    @Test
    void conciseExcerptExtractionTruncatesLongPages() {
        String longText = "Very long segment text ".repeat(30) + "end of segment.";
        ResumeDocument docWithLongPage = new ResumeDocument(
                "resume-long", "resume.pdf", "PDF", "SUCCESS", longText.length(),
                List.of(ResumeSegment.page(1, longText)),
                longText, Instant.parse("2026-10-21T10:15:30Z"));
        givenStoredResume(docWithLongPage);
        modelAnswers("Summary of experience [Page 1].");

        ResumeAskResponse response = service.ask(new ResumeAskRequest("Give me a summary."));

        assertThat(response.sources()).isNotEmpty();
        ResumeSource source = response.sources().get(0);
        assertThat(source.reference()).isEqualTo("Page 1");
        assertThat(source.evidence().length()).isLessThanOrEqualTo(200);
        assertThat(source.evidence()).endsWith("...");
    }

    @Test
    void resumeFeedbackInEnglishWithMissingMetricsAndNoFabrication() {
        givenStoredResume(resume);
        modelAnswers("""
                Strengths:
                - Clear technical background in Java and Spring Boot [Page 1].
                
                Important Issues:
                - Billing platform project lacks measurable business impact [Page 2]. (Why it matters: Hiring managers look for quantifiable contributions).
                
                Optional Improvements:
                - Consider linking to a public GitHub repository.
                
                Prioritized Next Steps:
                - Add verified metrics if available (e.g., [Template: Handled [insert verified number] requests/sec]).
                """);

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("Give me feedback on my resume."));

        assertThat(response.answer())
                .contains("Strengths")
                .contains("Important Issues")
                .contains("Prioritized Next Steps")
                .contains("verified metrics");
        assertThat(response.insufficientEvidence()).isFalse();
        assertThat(response.sourceReferences()).contains("Page 1", "Page 2");
    }

    @Test
    void resumeFeedbackInThanglishWithMissingMetrics() {
        givenStoredResume(resume);
        modelAnswers("""
                Strengths:
                - Java and Spring Boot skills nalla present pannirukinga [Page 1].
                
                Important Issues:
                - Billing platform project la metrics mention pannala [Page 2]. (Why it matters: Real-world impact kaata metrics romba mukkiyam).
                
                Prioritized Next Steps:
                - Ungalukku therinja verified measurements add pannunga [Template: Processed [insert verified number] txns].
                """);

        ResumeAskResponse response = service.ask(
                new ResumeAskRequest("En resume la enna mistakes iruku?"));

        assertThat(response.answer())
                .contains("Strengths")
                .contains("Important Issues")
                .contains("verified measurements");
        assertThat(response.insufficientEvidence()).isFalse();
        assertThat(response.sourceReferences()).contains("Page 1", "Page 2");
    }

    @Test
    void resumeFeedbackPreservesEntryLevelCourseworkWithoutBlindDeletion() {
        ResumeDocument studentDoc = new ResumeDocument(
                "student-1", "student.pdf", "PDF", "SUCCESS", 200,
                List.of(ResumeSegment.page(1, "Student Developer\nCoursework: Data Structures, Database Systems\nProject: Library App")),
                "Student Developer\nCoursework: Data Structures, Database Systems\nProject: Library App",
                Instant.parse("2026-10-21T10:15:30Z"));
        givenStoredResume(studentDoc);
        modelAnswers("""
                Strengths:
                - Relevant coursework in Data Structures establishes foundational knowledge [Page 1].
                
                Important Issues:
                - Library App project needs deeper architectural details [Page 1].
                
                Prioritized Next Steps:
                - Detail the database schema used in the project.
                """);

        ResumeAskResponse response = service.ask(new ResumeAskRequest("Review my student resume."));

        assertThat(response.answer()).contains("Relevant coursework");
        assertThat(response.insufficientEvidence()).isFalse();
        assertThat(response.sourceReferences()).contains("Page 1");
    }

    @Test
    void distinguishesExtractionArtifactsFromLayoutIssues() {
        givenStoredResume(resume);
        modelAnswers("""
                Strengths:
                - Strong backend foundations [Page 1].
                
                Note on Document Layout:
                - Extracted text shows tight spacing which may be an extraction artifact. Visually verify the original PDF.
                """);

        ResumeAskResponse response = service.ask(new ResumeAskRequest("Is the formatting ok?"));

        assertThat(response.answer()).contains("Visually verify the original PDF");
        assertThat(response.insufficientEvidence()).isFalse();
    }

    private void givenStoredResume(ResumeDocument document) {
        when(resumeRepository.findById(document.id())).thenReturn(Optional.of(document));
        sessionContext.setCurrentResumeId(document.id());
    }

    private void modelAnswers(String answer) {
        when(chatClient.prompt().system(anyString()).user(anyString()).call().content())
                .thenReturn(answer);
    }

    /** The message that was actually sent to the model by the last request. */
    private String lastUserMessage() {
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(chatClient.prompt().system(anyString()), atLeastOnce()).user(captor.capture());
        List<String> sent = captor.getAllValues();
        return sent.get(sent.size() - 1);
    }

    /** The system prompt that was actually sent to the model by the last request. */
    private String lastSystemPrompt() {
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(chatClient.prompt(), atLeastOnce()).system(captor.capture());
        List<String> sent = captor.getAllValues();
        return sent.get(sent.size() - 1);
    }
}
