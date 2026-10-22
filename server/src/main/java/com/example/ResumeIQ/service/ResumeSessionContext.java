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
 * Resolves the session from the active HTTP request (via HttpSession or X-Session-Id header),
 * with support for thread-local or explicit context for non-web environments and tests.
 */
@Component
public class ResumeSessionContext {

    public static final String SESSION_RESUME_ATTR = "RESUME_IQ_CURRENT_RESUME_ID";
    public static final String SESSION_HEADER = "X-Session-Id";

    private final Map<String, String> sessionResumeMap = new ConcurrentHashMap<>();
    private final ThreadLocal<String> threadLocalResumeId = new ThreadLocal<>();
    private final ThreadLocal<String> threadLocalConversationId = new ThreadLocal<>();

    /**
     * Resolves a stable conversation identifier associated with the user/session context.
     * Incorporates the active resume ID so that distinct resumes uploaded within the same
     * session do not share or leak conversation memory.
     */
    public String getConversationId() {
        String customConvId = threadLocalConversationId.get();
        if (customConvId != null && !customConvId.isBlank()) {
            return customConvId;
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
            return baseSession + ":" + recentResumeId.get();
        }

        String threadId = threadLocalResumeId.get();
        if (threadId != null && !threadId.isBlank()) {
            return "thread-conv-" + threadId;
        }

        return baseSession + "-conv";
    }

    /**
     * Explicitly sets a conversation id for thread/test context.
     */
    public void setCurrentConversationId(String conversationId) {
        threadLocalConversationId.set(conversationId);
    }

    /**
     * Stores the resume id as the most recently uploaded resume for the current session/user context.
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
     * Resolves the most recently uploaded resume id for the current session/user context.
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
     * Clears current thread and session mappings.
     */
    public void clear() {
        threadLocalResumeId.remove();
        threadLocalConversationId.remove();
        sessionResumeMap.clear();
    }

    private HttpServletRequest currentHttpRequest() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes servletAttrs) {
            return servletAttrs.getRequest();
        }
        return null;
    }
}
