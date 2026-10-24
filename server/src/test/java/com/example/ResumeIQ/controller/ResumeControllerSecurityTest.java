package com.example.ResumeIQ.controller;

import com.example.ResumeIQ.config.SecurityConfig;
import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.dto.response.ResumeUploadResponse;
import com.example.ResumeIQ.service.AuthService;
import com.example.ResumeIQ.service.ResumeAnalysisService;
import com.example.ResumeIQ.service.ResumeQaService;
import com.example.ResumeIQ.service.ResumeService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ResumeController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class ResumeControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private ResumeService resumeService;

    @MockitoBean
    private ResumeQaService resumeQaService;

    @MockitoBean
    private ResumeAnalysisService resumeAnalysisService;

    private final AppUser userA = new AppUser(
            "user-111",
            "google-sub-111",
            "alice@example.com",
            "Alice",
            null,
            Instant.now(),
            Instant.now()
    );

    private final AppUser userB = new AppUser(
            "user-222",
            "google-sub-222",
            "bob@example.com",
            "Bob",
            null,
            Instant.now(),
            Instant.now()
    );

    @Test
    @DisplayName("Unauthenticated request to /api/resumes/latest is rejected with 401")
    void unauthenticated_request_is_rejected_with_401() throws Exception {
        mockMvc.perform(get("/api/resumes/latest"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Unauthenticated request to /api/resumes/analyze is rejected with 401")
    void unauthenticated_analyze_is_rejected_with_401() throws Exception {
        mockMvc.perform(post("/api/resumes/analyze"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Authenticated User A retrieves own latest resume successfully")
    void authenticated_userA_retrieves_own_resume() throws Exception {
        String tokenA = "session-token-alice";
        when(authService.validateSession(tokenA)).thenReturn(Optional.of(userA));

        ResumeUploadResponse resumeA = new ResumeUploadResponse(
                "resume-a-uuid",
                "alice_cv.pdf",
                "PDF",
                "SUCCESS",
                1200,
                2,
                List.of("Page 1", "Page 2"),
                "Alice CV text",
                List.of(),
                Instant.now()
        );
        when(resumeService.getLatestResume(eq(userA))).thenReturn(Optional.of(resumeA));

        mockMvc.perform(get("/api/resumes/latest")
                        .cookie(new Cookie("resumeiq_session", tokenA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").value("resume-a-uuid"))
                .andExpect(jsonPath("$.filename").value("alice_cv.pdf"));
    }

    @Test
    @DisplayName("Authenticated User B sees 204 No Content when no resume has been uploaded by them")
    void authenticated_userB_receives_204_when_no_resume_uploaded() throws Exception {
        String tokenB = "session-token-bob";
        when(authService.validateSession(tokenB)).thenReturn(Optional.of(userB));
        when(resumeService.getLatestResume(eq(userB))).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/resumes/latest")
                        .cookie(new Cookie("resumeiq_session", tokenB)))
                .andExpect(status().isNoContent());
    }
}
