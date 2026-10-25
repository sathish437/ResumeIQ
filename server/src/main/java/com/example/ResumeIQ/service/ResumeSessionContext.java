package com.example.ResumeIQ.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks the most recently uploaded resume for each user or session context.
 * Strictly isolates conversation memory and resume references per authenticated user.
 */
@Component
public class ResumeSessionContext {

    public static final String SESSION_RESUME_ATTR = "RESUME_IQ_CURRENT_RESUME_ID";
    public static final String SESSION_HEADER = "X-Session-Id";

    private final Map<String, String> userResumeMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionResumeMap = new ConcurrentHashMap<>();
    private final ThreadLocal<String> threadLocalResumeId = new ThreadLocal<>();
    private final ThreadLocal<String> threadLocalConversationId = new ThreadLocal<>();

    /**
     * Resolves a user-scoped, resume-scoped conversation identifier.
     * Prevents distinct users from sharing or leaking conversational memory.
     */
    public String getConversationId(String userId, String resumeId) {
        String customConvId = threadLocalConversationId.get();
        if (customConvId != null && !customConvId.isBlank()) {
            return sanitizeConversationId(customConvId);
        }
        if (userId != null && !userId.isBlank() && resumeId != null && !resumeId.isBlank()) {
            return sanitizeConversationId("user-" + userId.strip() + ":resume-" + resumeId.strip());
        }
        return getConversationId();
    }

    /**
     * Resolves a conversation identifier associated with the user/session context.
     */
    public String getConversationId() {
        String customConvId = threadLocalConversationId.get();
        if (customConvId != null && !customConvId.isBlank()) {
            return sanitizeConversationId(customConvId);
        }

        HttpServletRequest request = currentHttpRequest();
        String baseSession = "default-session";
        if (request != null) {
            String explicitSession = request.getHeader(SESSION_HEADER);
            if (explicitSession != null && !explicitSession.isBlank()) {
                baseSession = explicitSession.strip();
            } else {
                HttpSession session = request.getSession(true);
                baseSession = session.getId();
            }
        }

        Optional<String> recentResumeId = getRecentResumeId();
        if (recentResumeId.isPresent()) {
            return sanitizeConversationId(baseSession + ":" + recentResumeId.get());
        }

        String threadId = threadLocalResumeId.get();
        if (threadId != null && !threadId.isBlank()) {
            return sanitizeConversationId("thread-conv-" + threadId);
        }

        return sanitizeConversationId(baseSession + "-conv");
    }

    private String sanitizeConversationId(String rawId) {
        if (rawId == null || rawId.isBlank()) {
            return "default-conv";
        }
        String stripped = rawId.strip();
        if (stripped.length() <= 36) {
            return stripped;
        }
        return java.util.UUID.nameUUIDFromBytes(stripped.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString();
    }

    /**
     * Explicitly sets a conversation id for thread/test context.
     */
    public void setCurrentConversationId(String conversationId) {
        threadLocalConversationId.set(conversationId);
    }

    /**
     * Stores the resume id as the most recently uploaded resume for an authenticated user.
     */
    public void setRecentResumeId(String userId, String resumeId) {
        if (userId != null && !userId.isBlank() && resumeId != null && !resumeId.isBlank()) {
            userResumeMap.put(userId.strip(), resumeId.strip());
        }
        setRecentResumeId(resumeId);
    }

    /**
     * Stores the resume id as the most recently uploaded resume for the current session/thread.
     */
    public void setRecentResumeId(String resumeId) {
        if (resumeId == null || resumeId.isBlank()) {
            return;
        }
        threadLocalResumeId.set(resumeId);

        HttpServletRequest request = currentHttpRequest();
        if (request != null) {
            String explicitSession = request.getHeader(SESSION_HEADER);
            if (explicitSession != null && !explicitSession.isBlank()) {
                sessionResumeMap.put(explicitSession.strip(), resumeId);
            }
            HttpSession session = request.getSession(true);
            session.setAttribute(SESSION_RESUME_ATTR, resumeId);
            sessionResumeMap.put(session.getId(), resumeId);
        }
    }

    /**
     * Resolves the most recently uploaded resume id for a given user.
     */
    public Optional<String> getRecentResumeId(String userId) {
        if (userId != null && !userId.isBlank()) {
            String resumeId = userResumeMap.get(userId.strip());
            if (resumeId != null && !resumeId.isBlank()) {
                return Optional.of(resumeId);
            }
        }
        return getRecentResumeId();
    }

    /**
     * Resolves the most recently uploaded resume id for the current session/thread.
     */
    public Optional<String> getRecentResumeId() {
        HttpServletRequest request = currentHttpRequest();
        if (request != null) {
            String explicitSession = request.getHeader(SESSION_HEADER);
            if (explicitSession != null && !explicitSession.isBlank()) {
                String resumeId = sessionResumeMap.get(explicitSession.strip());
                if (resumeId != null) {
                    return Optional.of(resumeId);
                }
            }
            HttpSession session = request.getSession(false);
            if (session != null) {
                Object attr = session.getAttribute(SESSION_RESUME_ATTR);
                if (attr instanceof String resumeId && !resumeId.isBlank()) {
                    return Optional.of(resumeId);
                }
                String resumeId = sessionResumeMap.get(session.getId());
                if (resumeId != null) {
                    return Optional.of(resumeId);
                }
            }
            return Optional.empty();
        }

        String threadId = threadLocalResumeId.get();
        return Optional.ofNullable(threadId);
    }

    /**
     * Explicitly associates a resume id with a session identifier.
     */
    public void setSessionResumeId(String sessionId, String resumeId) {
        if (sessionId != null && resumeId != null) {
            sessionResumeMap.put(sessionId, resumeId);
        }
    }

    /**
     * Explicitly gets a resume id associated with a session identifier.
     */
    public Optional<String> getSessionResumeId(String sessionId) {
        if (sessionId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(sessionResumeMap.get(sessionId));
    }

    /**
     * Explicitly sets the resume id for the current thread/test context.
     */
    public void setCurrentResumeId(String resumeId) {
        threadLocalResumeId.set(resumeId);
    }

    /**
     * Clears current thread, user, and session mappings.
     */
    public void clear() {
        threadLocalResumeId.remove();
        threadLocalConversationId.remove();
        sessionResumeMap.clear();
        userResumeMap.clear();
    }

    private HttpServletRequest currentHttpRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            return servletAttrs.getRequest();
        }
        return null;
    }
}
