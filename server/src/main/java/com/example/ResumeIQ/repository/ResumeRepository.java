package com.example.ResumeIQ.repository;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

/**
 * Stores uploaded resumes and their citable segments, scoped by user_id for strict isolation.
 */
@Repository
public class ResumeRepository {

    private static final String INSERT_RESUME = """
            INSERT INTO resume (id, user_id, filename, file_type, status, character_count,
                                segment_count, full_text, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    private static final String INSERT_SEGMENT = """
            INSERT INTO resume_segment (resume_id, reference_label, segment_index, segment_text)
            VALUES (?, ?, ?, ?)
            """;

    private static final String SELECT_RESUME = """
            SELECT id, user_id, filename, file_type, status, character_count, full_text, created_at
            FROM resume WHERE id = ?
            """;

    private static final String SELECT_RESUME_BY_ID_AND_USER = """
            SELECT id, user_id, filename, file_type, status, character_count, full_text, created_at
            FROM resume WHERE id = ? AND user_id = ?
            """;

    private static final String SELECT_LATEST_RESUME_BY_USER = """
            SELECT id, user_id, filename, file_type, status, character_count, full_text, created_at
            FROM resume WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
            """;

    private static final String SELECT_ALL_BY_USER = """
            SELECT id, user_id, filename, file_type, status, character_count, full_text, created_at
            FROM resume WHERE user_id = ? ORDER BY created_at DESC
            """;

    private static final String DELETE_RESUME_BY_ID_AND_USER = """
            DELETE FROM resume WHERE id = ? AND user_id = ?
            """;

    private static final String SELECT_SEGMENTS = """
            SELECT reference_label, segment_index, segment_text
            FROM resume_segment WHERE resume_id = ? ORDER BY segment_index
            """;

    private final JdbcTemplate jdbcTemplate;

    public ResumeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void save(ResumeDocument resume) {
        jdbcTemplate.update(INSERT_RESUME,
                resume.id(),
                resume.userId(),
                resume.filename(),
                resume.fileType(),
                resume.status(),
                resume.characterCount(),
                resume.segments().size(),
                resume.text(),
                Timestamp.from(resume.createdAt()));

        jdbcTemplate.batchUpdate(INSERT_SEGMENT, resume.segments(), resume.segments().size(),
                (statement, segment) -> {
                    statement.setString(1, resume.id());
                    statement.setString(2, segment.reference());
                    statement.setInt(3, segment.index());
                    statement.setString(4, segment.text());
                });
    }

    public Optional<ResumeDocument> findById(String id) {
        List<ResumeRow> rows = jdbcTemplate.query(SELECT_RESUME, ResumeRepository::mapRow, id);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(toDomain(rows.get(0)));
    }

    public Optional<ResumeDocument> findByIdAndUserId(String id, String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        List<ResumeRow> rows = jdbcTemplate.query(SELECT_RESUME_BY_ID_AND_USER, ResumeRepository::mapRow, id, userId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(toDomain(rows.get(0)));
    }

    public Optional<ResumeDocument> findLatestByUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return Optional.empty();
        }
        List<ResumeRow> rows = jdbcTemplate.query(SELECT_LATEST_RESUME_BY_USER, ResumeRepository::mapRow, userId);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(toDomain(rows.get(0)));
    }

    public List<ResumeDocument> findAllByUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        List<ResumeRow> rows = jdbcTemplate.query(SELECT_ALL_BY_USER, ResumeRepository::mapRow, userId);
        return rows.stream().map(this::toDomain).toList();
    }

    @Transactional
    public boolean deleteByIdAndUserId(String id, String userId) {
        if (userId == null || userId.isBlank()) {
            return false;
        }
        int deleted = jdbcTemplate.update(DELETE_RESUME_BY_ID_AND_USER, id, userId);
        return deleted > 0;
    }

    private ResumeDocument toDomain(ResumeRow row) {
        List<ResumeSegment> segments = jdbcTemplate.query(SELECT_SEGMENTS,
                (resultSet, rowNumber) -> new ResumeSegment(
                        resultSet.getString("reference_label"),
                        resultSet.getInt("segment_index"),
                        resultSet.getString("segment_text")),
                row.id());

        return new ResumeDocument(
                row.id(),
                row.userId(),
                row.filename(),
                row.fileType(),
                row.status(),
                row.characterCount(),
                segments,
                row.fullText(),
                row.createdAt());
    }

    private static ResumeRow mapRow(ResultSet resultSet, int rowNumber) throws SQLException {
        return new ResumeRow(
                resultSet.getString("id"),
                resultSet.getString("user_id"),
                resultSet.getString("filename"),
                resultSet.getString("file_type"),
                resultSet.getString("status"),
                resultSet.getInt("character_count"),
                resultSet.getString("full_text"),
                resultSet.getTimestamp("created_at").toInstant());
    }

    private record ResumeRow(
            String id,
            String userId,
            String filename,
            String fileType,
            String status,
            int characterCount,
            String fullText,
            java.time.Instant createdAt) {
    }
}
