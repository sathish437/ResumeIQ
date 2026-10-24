package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.domain.UserSession;
import com.example.ResumeIQ.dto.response.AuthResponse;
import com.example.ResumeIQ.repository.SessionRepository;
import com.example.ResumeIQ.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private GoogleTokenVerifierService googleTokenVerifierService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SessionRepository sessionRepository;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(googleTokenVerifierService, userRepository, sessionRepository);
    }

    @Test
    void authenticateWithGoogle_createsNewUser_whenUserDoesNotExist() {
        String credential = "valid-google-id-token";
        var verified = new GoogleTokenVerifierService.VerifiedGoogleUser(
                "google-sub-123",
                "candidate@example.com",
                "Jane Doe",
                "https://example.com/avatar.jpg"
        );

        when(googleTokenVerifierService.verify(credential)).thenReturn(Optional.of(verified));
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.empty());

        AuthResponse response = authService.authenticateWithGoogle(credential);

        assertThat(response.authenticated()).isTrue();
        assertThat(response.token()).isNotBlank();
        assertThat(response.user()).isNotNull();
        assertThat(response.user().email()).isEqualTo("candidate@example.com");
        assertThat(response.user().name()).isEqualTo("Jane Doe");
        assertThat(response.user().pictureUrl()).isEqualTo("https://example.com/avatar.jpg");

        ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().googleId()).isEqualTo("google-sub-123");
        assertThat(userCaptor.getValue().email()).isEqualTo("candidate@example.com");

        ArgumentCaptor<UserSession> sessionCaptor = ArgumentCaptor.forClass(UserSession.class);
        verify(sessionRepository).save(sessionCaptor.capture());
        assertThat(sessionCaptor.getValue().token()).isEqualTo(response.token());
    }

    @Test
    void authenticateWithGoogle_logsInExistingUser_whenGoogleIdMatches() {
        String credential = "valid-google-id-token";
        var verified = new GoogleTokenVerifierService.VerifiedGoogleUser(
                "google-sub-123",
                "candidate@example.com",
                "Jane Doe Updated",
                "https://example.com/new-avatar.jpg"
        );

        AppUser existingUser = new AppUser(
                "existing-uuid-1",
                "google-sub-123",
                "candidate@example.com",
                "Jane Doe",
                "https://example.com/old.jpg",
                Instant.now().minus(30, ChronoUnit.DAYS),
                Instant.now().minus(1, ChronoUnit.DAYS)
        );

        when(googleTokenVerifierService.verify(credential)).thenReturn(Optional.of(verified));
        when(userRepository.findByGoogleId("google-sub-123")).thenReturn(Optional.of(existingUser));

        AuthResponse response = authService.authenticateWithGoogle(credential);

        assertThat(response.authenticated()).isTrue();
        assertThat(response.user().id()).isEqualTo("existing-uuid-1");
        assertThat(response.user().name()).isEqualTo("Jane Doe Updated");

        verify(userRepository, never()).save(any());
        verify(userRepository).update(any(AppUser.class));
        verify(sessionRepository).save(any(UserSession.class));
    }

    @Test
    void authenticateWithGoogle_linksAccount_whenEmailMatches() {
        String credential = "valid-google-id-token";
        var verified = new GoogleTokenVerifierService.VerifiedGoogleUser(
                "google-sub-456",
                "candidate@example.com",
                "Jane Doe",
                "https://example.com/avatar.jpg"
        );

        AppUser existingEmailUser = new AppUser(
                "existing-uuid-2",
                "legacy-or-empty-id",
                "candidate@example.com",
                "Jane D.",
                null,
                Instant.now().minus(10, ChronoUnit.DAYS),
                Instant.now().minus(2, ChronoUnit.DAYS)
        );

        when(googleTokenVerifierService.verify(credential)).thenReturn(Optional.of(verified));
        when(userRepository.findByGoogleId("google-sub-456")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("candidate@example.com")).thenReturn(Optional.of(existingEmailUser));

        AuthResponse response = authService.authenticateWithGoogle(credential);

        assertThat(response.authenticated()).isTrue();
        assertThat(response.user().id()).isEqualTo("existing-uuid-2");
        verify(userRepository).linkGoogleId(anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void authenticateWithGoogle_rejectsInvalidToken() {
        when(googleTokenVerifierService.verify("invalid-token")).thenReturn(Optional.empty());

        AuthResponse response = authService.authenticateWithGoogle("invalid-token");

        assertThat(response.authenticated()).isFalse();
        assertThat(response.token()).isNull();
        assertThat(response.user()).isNull();
        verify(userRepository, never()).save(any());
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void validateSession_returnsUser_whenSessionIsValid() {
        String token = "valid-session-token";
        UserSession session = new UserSession(
                token,
                "user-123",
                Instant.now().minus(1, ChronoUnit.HOURS),
                Instant.now().plus(6, ChronoUnit.DAYS)
        );
        AppUser user = new AppUser(
                "user-123",
                "google-123",
                "user@example.com",
                "User Name",
                "https://example.com/pic.jpg",
                Instant.now().minus(1, ChronoUnit.HOURS),
                Instant.now()
        );

        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(session));
        when(userRepository.findById("user-123")).thenReturn(Optional.of(user));

        Optional<AppUser> validated = authService.validateSession(token);

        assertThat(validated).isPresent();
        assertThat(validated.get().id()).isEqualTo("user-123");
    }

    @Test
    void validateSession_rejectsExpiredSession() {
        String token = "expired-token";
        UserSession expiredSession = new UserSession(
                token,
                "user-123",
                Instant.now().minus(10, ChronoUnit.DAYS),
                Instant.now().minus(3, ChronoUnit.DAYS)
        );

        when(sessionRepository.findByToken(token)).thenReturn(Optional.of(expiredSession));

        Optional<AppUser> validated = authService.validateSession(token);

        assertThat(validated).isEmpty();
        verify(sessionRepository).deleteByToken(token);
    }

    @Test
    void logout_deletesSession() {
        authService.logout("session-to-delete");
        verify(sessionRepository).deleteByToken("session-to-delete");
    }
}
