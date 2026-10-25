package com.example.ResumeIQ.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.assertj.core.api.Assertions.assertThat;

class ResumeSessionContextTest {

    private final ResumeSessionContext context = new ResumeSessionContext();

    @BeforeEach
    void resetContext() {
        context.clear();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    @DisplayName("Isolates resumes between different sessions")
    void isolatesResumesBetweenDifferentSessions() {
        context.setSessionResumeId("session-1", "resume-1");
        context.setSessionResumeId("session-2", "resume-2");

        assertThat(context.getSessionResumeId("session-1")).contains("resume-1");
        assertThat(context.getSessionResumeId("session-2")).contains("resume-2");
        assertThat(context.getSessionResumeId("session-3")).isEmpty();
    }

    @Test
    @DisplayName("Generates isolated conversation ID per session and resume")
    void isolatesConversationIdPerSessionAndResume() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession(null, "session-abc");
        request.setSession(session);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        context.setRecentResumeId("resume-xyz");

        String convId = context.getConversationId();
        assertThat(convId).isEqualTo("session-abc:resume-xyz");

        // When a new resume is uploaded in the same session, conversation ID changes to isolate memory
        context.setRecentResumeId("resume-new");
        String newConvId = context.getConversationId();
        assertThat(newConvId).isEqualTo("session-abc:resume-new");
        assertThat(newConvId).isNotEqualTo(convId);
    }

    @Test
    @DisplayName("Supports explicit X-Session-Id header")
    void supportsExplicitSessionHeader() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(ResumeSessionContext.SESSION_HEADER, "custom-client-123");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        context.setRecentResumeId("resume-999");

        assertThat(context.getRecentResumeId()).contains("resume-999");
        assertThat(context.getConversationId()).isEqualTo("custom-client-123:resume-999");
    }

    @Test
    @DisplayName("Thread-local fallback works in non-web environment")
    void threadLocalFallbackWorksInNonWebEnvironment() {
        context.setCurrentResumeId("thread-res-1");
        context.setCurrentConversationId("custom-conv-1");

        assertThat(context.getRecentResumeId()).contains("thread-res-1");
        assertThat(context.getConversationId()).isEqualTo("custom-conv-1");

        context.clear();
        assertThat(context.getRecentResumeId()).isEmpty();
    }

    @Test
    @DisplayName("Guarantees conversation ID never exceeds 36 chars to prevent database column overflow")
    void ensuresConversationIdNeverExceeds36Chars() {
        String longUserId = "550e8400-e29b-41d4-a716-446655440000";
        String longResumeId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

        String convId = context.getConversationId(longUserId, longResumeId);
        assertThat(convId).isNotNull();
        assertThat(convId.length()).isLessThanOrEqualTo(36);

        // Deterministic: same user + resume gives same conversation ID
        String secondCall = context.getConversationId(longUserId, longResumeId);
        assertThat(secondCall).isEqualTo(convId);

        // Isolated: different user or resume gives different conversation ID
        String differentUserConv = context.getConversationId("different-user-id-1234567890", longResumeId);
        assertThat(differentUserConv).isNotEqualTo(convId);
        assertThat(differentUserConv.length()).isLessThanOrEqualTo(36);
    }
}
