package com.example.ResumeIQ.repository;

import com.example.ResumeIQ.domain.AppUser;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.Optional;

/**
 * Manages persistence for application users authenticated via Google OAuth.
 */
@Repository
public class UserRepository {

    private static final String INSERT_USER = """
            INSERT INTO app_user (id, google_id, email, name, picture_url, created_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

    private static final String UPDATE_USER = """
            UPDATE app_user
            SET name = ?, picture_url = ?, last_login_at = ?
            WHERE id = ?
            """;

    private static final String UPDATE_GOOGLE_ID = """
            UPDATE app_user
            SET google_id = ?, name = ?, picture_url = ?, last_login_at = ?
            WHERE id = ?
            """;

    private static final String SELECT_BY_ID = """
            SELECT id, google_id, email, name, picture_url, created_at, last_login_at
            FROM app_user WHERE id = ?
            """;

    private static final String SELECT_BY_GOOGLE_ID = """
            SELECT id, google_id, email, name, picture_url, created_at, last_login_at
            FROM app_user WHERE google_id = ?
            """;

    private static final String SELECT_BY_EMAIL = """
            SELECT id, google_id, email, name, picture_url, created_at, last_login_at
            FROM app_user WHERE LOWER(email) = LOWER(?)
            """;

    private final JdbcTemplate jdbcTemplate;
    private final RowMapper<AppUser> rowMapper = new UserRowMapper();

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public void save(AppUser user) {
        jdbcTemplate.update(INSERT_USER,
                user.id(),
                user.googleId(),
                user.email(),
                user.name(),
                user.pictureUrl(),
                Timestamp.from(user.createdAt()),
                Timestamp.from(user.lastLoginAt()));
    }

    @Transactional
    public void update(AppUser user) {
        jdbcTemplate.update(UPDATE_USER,
                user.name(),
                user.pictureUrl(),
                Timestamp.from(user.lastLoginAt()),
                user.id());
    }

    @Transactional
    public void linkGoogleId(String userId, String googleId, String name, String pictureUrl, Timestamp lastLogin) {
        jdbcTemplate.update(UPDATE_GOOGLE_ID,
                googleId,
                name,
                pictureUrl,
                lastLogin,
                userId);
    }

    public Optional<AppUser> findById(String id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(SELECT_BY_ID, rowMapper, id));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<AppUser> findByGoogleId(String googleId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(SELECT_BY_GOOGLE_ID, rowMapper, googleId));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<AppUser> findByEmail(String email) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(SELECT_BY_EMAIL, rowMapper, email));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    private static class UserRowMapper implements RowMapper<AppUser> {
        @Override
        public AppUser mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new AppUser(
                    rs.getString("id"),
                    rs.getString("google_id"),
                    rs.getString("email"),
                    rs.getString("name"),
                    rs.getString("picture_url"),
                    rs.getTimestamp("created_at").toInstant(),
                    rs.getTimestamp("last_login_at").toInstant()
            );
        }
    }
}
