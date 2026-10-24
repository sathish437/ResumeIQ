package com.example.ResumeIQ.repository;

import com.example.ResumeIQ.domain.UserSession;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;

/**
 * Manages persistence for user authentication sessions.
 */
@Repository
public class SessionRepository {

    private static final String INSERT_SESSION = """
            INSERT INTO user_session (token, user_id, created_at, expires_at)
            VALUES (?, ?, ?, ?)
            """;

    private static final String SELECT_BY_TOKEN = """
            SELECT token, user_id, created_at, expires_at
            FROM user_session WHERE token = ?
            """;

    private static final String DELETE_BY_TOKEN = """
            DELETE FROM user_session WHERE token = ?
            """;

    private static final String DELETE_EXPIRED = """
            DELETE FROM user_session WHERE expires_at < ?
            """;

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<UserSession> rowMapper = new SessionRowMapper();

    public SessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void save(UserSession session) {
        jdbcTemplate.update(INSERT_SESSION,
                session.token(),
                session.userId(),
                Timestamp.from(session.createdAt()),
                Timestamp.from(session.expiresAt()));
    }

    public Optional<UserSession> findByToken(String token) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(SELECT_BY_TOKEN, rowMapper, token));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Transactional
    public void deleteByToken(String token) {
        jdbcTemplate.update(DELETE_BY_TOKEN, token);
    }

    @Transactional
    public int deleteExpired(Instant now) {
        return jdbcTemplate.update(DELETE_EXPIRED, Timestamp.from(now));
    }

    private static class SessionRowMapper implements RowMapper<UserSession> {
        @Override
        public UserSession mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new UserSession(
                    rs.getString("token"),
                    rs.getString("user_id"),
                    rs.getTimestamp("created_at").toInstant(),
                    rs.getTimestamp("expires_at").toInstant()
            );
        }
    }
}
