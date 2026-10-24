package com.example.ResumeIQ.service;

import com.example.ResumeIQ.domain.AppUser;
import com.example.ResumeIQ.domain.UserSession;
import com.example.ResumeIQ.dto.response.AuthResponse;
import com.example.ResumeIQ.dto.response.UserProfileResponse;
import com.example.ResumeIQ.repository.SessionRepository;
import com.example.ResumeIQ.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

/**
 * Manages Google OAuth authentication, safe account linking, session creation,
 * and user session validation.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    public static final long SESSION_EXPIRY_DAYS = 7;

    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    public AuthService(
            GoogleTokenVerifierService googleTokenVerifierService,
            UserRepository userRepository,
            SessionRepository sessionRepository) {
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Authenticates a user with a verified Google ID token.
     * Implements safe account linking, user creation, and session issuance.
     */
    @Transactional
    public AuthResponse authenticateWithGoogle(String credential) {
        if (credential == null || credential.isBlank()) {
            return AuthResponse.unauthenticated("Google credential token is missing or empty.");
        }

        var verifiedOpt = googleTokenVerifierService.verify(credential);
        if (verifiedOpt.isEmpty()) {
            return AuthResponse.unauthenticated("Google verification failed. The provided token is invalid, expired, or untrusted.");
        }

        var verified = verifiedOpt.get();
        Instant now = Instant.now();
        String normalizedEmail = verified.email().toLowerCase().strip();

        // 1. Check if user already exists by Google ID
        Optional<AppUser> existingByGoogleId = userRepository.findByGoogleId(verified.googleId());
        AppUser user;

        if (existingByGoogleId.isPresent()) {
            AppUser existing = existingByGoogleId.get();
            user = existing.withLastLogin(now, verified.name(), verified.pictureUrl());
            userRepository.update(user);
            log.info("Existing user logged in via Google: id={}, email={}", user.id(), user.email());
        } else {
            // 2. Check if a user account exists with the same verified email
            Optional<AppUser> existingByEmail = userRepository.findByEmail(normalizedEmail);
            if (existingByEmail.isPresent()) {
                AppUser existing = existingByEmail.get();
                // Safely link Google ID to this verified email account
                userRepository.linkGoogleId(
                        existing.id(),
                        verified.googleId(),
                        verified.name(),
                        verified.pictureUrl(),
                        Timestamp.from(now)
                );
                user = new AppUser(
                        existing.id(),
                        verified.googleId(),
                        normalizedEmail,
                        verified.name(),
                        verified.pictureUrl(),
                        existing.createdAt(),
                        now
                );
                log.info("Linked Google identity to existing user account: id={}, email={}", user.id(), user.email());
            } else {
                // 3. Create a brand new user account
                String newUserId = UUID.randomUUID().toString();
                user = new AppUser(
                        newUserId,
                        verified.googleId(),
                        normalizedEmail,
                        verified.name(),
                        verified.pictureUrl(),
                        now,
                        now
                );
                userRepository.save(user);
                log.info("Created new user account from Google sign-in: id={}, email={}", user.id(), user.email());
            }
        }

        // 4. Create cryptographically secure session
        String sessionToken = generateSessionToken();
        Instant expiresAt = now.plus(SESSION_EXPIRY_DAYS, ChronoUnit.DAYS);
        UserSession session = new UserSession(sessionToken, user.id(), now, expiresAt);
        sessionRepository.save(session);

        UserProfileResponse profile = toProfile(user);
        return AuthResponse.success(sessionToken, profile);
    }

    /**
     * Validates an active session token and returns the authenticated user if valid.
     */
    public Optional<AppUser> validateSession(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        Optional<UserSession> sessionOpt = sessionRepository.findByToken(token.strip());
        if (sessionOpt.isEmpty()) {
            return Optional.empty();
        }

        UserSession session = sessionOpt.get();
        if (session.isExpired()) {
            sessionRepository.deleteByToken(session.token());
            return Optional.empty();
        }

        return userRepository.findById(session.userId());
    }

    /**
     * Invalidates the session on logout.
     */
    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessionRepository.deleteByToken(token.strip());
        }
    }

    public UserProfileResponse toProfile(AppUser user) {
        return new UserProfileResponse(
                user.id(),
                user.email(),
                user.name(),
                user.pictureUrl()
        );
    }

    private String generateSessionToken() {
        byte[] randomBytes = new byte[24];
        SECURE_RANDOM.nextBytes(randomBytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : randomBytes) {
            sb.append(String.format("%02x", b));
        }
        return UUID.randomUUID().toString().replace("-", "") + sb;
    }
}
