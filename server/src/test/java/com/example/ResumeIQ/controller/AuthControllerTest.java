package com.example.ResumeIQ.controller;

import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.dto.response.AuthResponse;
import com.example.ResumeIQ.dto.response.UserProfileResponse;
import com.example.ResumeIQ.service.AuthService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthService authService;

    @Test
    void authenticateWithGoogle_succeeds_whenValidCredentialProvided() throws Exception {
        UserProfileResponse profile = new UserProfileResponse(
                "user-uuid",
                "test@example.com",
                "Alex Smith",
                "https://example.com/photo.jpg"
        );
        AuthResponse successResponse = AuthResponse.success("session-token-xyz", profile);

        when(authService.authenticateWithGoogle("valid-token")).thenReturn(successResponse);

        String jsonPayload = """
                {
                    "credential": "valid-token"
                }
                """;

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.token").value("session-token-xyz"))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.name").value("Alex Smith"))
                .andExpect(header().exists(HttpHeaders.SET_COOKIE))
                .andExpect(cookie().value(AuthController.SESSION_COOKIE_NAME, "session-token-xyz"))
                .andExpect(cookie().httpOnly(AuthController.SESSION_COOKIE_NAME, true));
    }

    @Test
    void authenticateWithGoogle_returnsUnauthorized_whenTokenInvalid() throws Exception {
        AuthResponse failureResponse = AuthResponse.unauthenticated("Google verification failed.");
        when(authService.authenticateWithGoogle("bad-token")).thenReturn(failureResponse);

        String jsonPayload = """
                {
                    "credential": "bad-token"
                }
                """;

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    void getCurrentUser_returnsProfile_whenBearerTokenProvided() throws Exception {
        AppUser user = new AppUser(
                "user-1",
                "g-1",
                "user@example.com",
                "User One",
                "https://pic.jpg",
                Instant.now(),
                Instant.now()
        );
        UserProfileResponse profile = new UserProfileResponse("user-1", "user@example.com", "User One", "https://pic.jpg");

        when(authService.validateSession("my-token")).thenReturn(Optional.of(user));
        when(authService.toProfile(user)).thenReturn(profile);

        mockMvc.perform(get("/api/auth/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer my-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.email").value("user@example.com"));
    }

    @Test
    void getCurrentUser_returnsProfile_whenCookieProvided() throws Exception {
        AppUser user = new AppUser(
                "user-1",
                "g-1",
                "user@example.com",
                "User One",
                null,
                Instant.now(),
                Instant.now()
        );
        UserProfileResponse profile = new UserProfileResponse("user-1", "user@example.com", "User One", null);

        when(authService.validateSession("cookie-token")).thenReturn(Optional.of(user));
        when(authService.toProfile(user)).thenReturn(profile);

        mockMvc.perform(get("/api/auth/me")
                        .cookie(new Cookie(AuthController.SESSION_COOKIE_NAME, "cookie-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.user.email").value("user@example.com"));
    }

    @Test
    void getCurrentUser_returnsUnauthorized_whenNoSessionProvided() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.authenticated").value(false));
    }

    @Test
    void logout_clearsCookieAndDeletesSession() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .cookie(new Cookie(AuthController.SESSION_COOKIE_NAME, "active-token")))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge(AuthController.SESSION_COOKIE_NAME, 0));

        verify(authService).logout("active-token");
    }
}
