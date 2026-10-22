package com.example.ResumeIQ.repository;

import com.example.ResumeIQ.dto.response.ResumeAnalysisResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class ResumeAnalysisRepository {

    private static final String INSERT_OR_UPDATE = """
            INSERT INTO resume_analysis (resume_id, summary, skills_json, projects_json,
                                         education_json, missing_info, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (resume_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                skills_json = EXCLUDED.skills_json,
                projects_json = EXCLUDED.projects_json,
                education_json = EXCLUDED.education_json,
                missing_info = EXCLUDED.missing_info,
                created_at = EXCLUDED.created_at
            """;

    private static final String INSERT_H2_OR_POSTGRES = """
            MERGE INTO resume_analysis KEY (resume_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

    private static final String SELECT_BY_ID = """
            SELECT resume_id, summary, skills_json, projects_json, education_json, missing_info, created_at
            FROM resume_analysis WHERE resume_id = ?
            """;

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ResumeAnalysisRepository(JdbcTemplate jdbcTemplate,
                                    @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public void save(ResumeAnalysisResponse analysis) {
        String skillsJson = toJson(analysis.skills());
        String projectsJson = toJson(analysis.projects());
        String educationJson = toJson(analysis.educationAndCertifications());
        String missingInfoJson = toJson(analysis.missingOrUnavailableInformation());
        Timestamp timestamp = Timestamp.from(analysis.analyzedAt() != null ? analysis.analyzedAt() : Instant.now());

        // First attempt standard ON CONFLICT (PostgreSQL), if unsupported in some H2 modes, fallback to delete+insert
        try {
            jdbcTemplate.update(INSERT_OR_UPDATE,
                    analysis.resumeId(),
                    analysis.professionalSummary(),
                    skillsJson,
                    projectsJson,
                    educationJson,
                    missingInfoJson,
                    timestamp);
        } catch (Exception ex) {
            // Safe fallback for in-memory H2 test dialect
            jdbcTemplate.update("DELETE FROM resume_analysis WHERE resume_id = ?", analysis.resumeId());
            jdbcTemplate.update("""
                    INSERT INTO resume_analysis (resume_id, summary, skills_json, projects_json,
                                                 education_json, missing_info, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    analysis.resumeId(),
                    analysis.professionalSummary(),
                    skillsJson,
                    projectsJson,
                    educationJson,
                    missingInfoJson,
                    timestamp);
        }
    }

    public Optional<ResumeAnalysisResponse> findByResumeId(String resumeId) {
        List<ResumeAnalysisResponse> results = jdbcTemplate.query(
                SELECT_BY_ID,
                (rs, rowNum) -> mapRow(rs),
                resumeId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    private ResumeAnalysisResponse mapRow(ResultSet rs) throws SQLException {
        String resumeId = rs.getString("resume_id");
        String summary = rs.getString("summary");
        List<String> skills = fromJson(rs.getString("skills_json"), new TypeReference<>() {});
        List<ResumeAnalysisResponse.ProjectDetail> projects = fromJson(rs.getString("projects_json"), new TypeReference<>() {});
        List<String> education = fromJson(rs.getString("education_json"), new TypeReference<>() {});
        List<String> missingInfo = fromJson(rs.getString("missing_info"), new TypeReference<>() {});
        Instant createdAt = rs.getTimestamp("created_at").toInstant();

        return new ResumeAnalysisResponse(
                resumeId,
                summary,
                skills,
                projects,
                education,
                missingInfo,
                createdAt);
    }

    private String toJson(Object obj) {
        if (obj == null) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private <T> T fromJson(String json, TypeReference<T> typeRef) {
        if (json == null || json.isBlank()) {
            json = "[]";
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (JsonProcessingException e) {
            try {
                return objectMapper.readValue("[]", typeRef);
            } catch (JsonProcessingException ignored) {
                return null;
            }
        }
    }
}
