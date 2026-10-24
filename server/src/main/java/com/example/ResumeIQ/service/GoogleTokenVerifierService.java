package com.example.ResumeIQ.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

/**
 * Validates Google ID tokens using Google's official public keys, checking
 * signature, issuer, audience, expiration, and email verification status.
 */
@Service
public class GoogleTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    @Autowired
    public GoogleTokenVerifierService(
            @Value("${app.auth.google.client-id:837596203973-dnhf7rp7qgpte6bbafunvshu2b0ghmui.apps.googleusercontent.com}") String clientId) {
        this(clientId, new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build());
    }

    public GoogleTokenVerifierService(String clientId, GoogleIdTokenVerifier verifier) {
        this.clientId = clientId;
        this.verifier = verifier;
    }

    public record VerifiedGoogleUser(
            String googleId,
            String email,
            String name,
            String pictureUrl
    ) {}

    /**
     * Verifies the Google ID token and returns the verified user details.
     */
    public Optional<VerifiedGoogleUser> verify(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            return Optional.empty();
        }

        try {
            GoogleIdToken idToken = verifier.verify(idTokenString.strip());
            if (idToken == null) {
                log.warn("Google ID token verification failed (invalid signature, expired, or audience mismatch for client: {})", clientId);
                return Optional.empty();
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            boolean emailVerified = Boolean.TRUE.equals(payload.getEmailVerified());

            if (email == null || email.isBlank()) {
                log.warn("Google ID token has no email address associated");
                return Optional.empty();
            }

            if (!emailVerified) {
                log.warn("Google ID token email is not verified: {}", email);
                return Optional.empty();
            }

            String googleId = payload.getSubject();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");

            if (name == null || name.isBlank()) {
                name = email.split("@")[0];
            }

            return Optional.of(new VerifiedGoogleUser(googleId, email, name, pictureUrl));
        } catch (Exception e) {
            log.warn("Exception during Google ID token verification: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
