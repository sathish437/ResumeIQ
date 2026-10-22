package com.example.ResumeIQ.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseConfigTest {

    private DatabaseConfig databaseConfig;
    private DataSourceProperties properties;

    @BeforeEach
    void setUp() {
        databaseConfig = new DatabaseConfig();
        properties = new DataSourceProperties();
    }

    @Test
    @DisplayName("Normalizes Neon postgresql:// URI with embedded credentials into jdbc:postgresql:// format")
    void normalizesNeonUriWithCredentials() {
        properties.setUrl("postgresql://neonuser:neonpass@ep-cool-river-12345.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");
        properties.setUsername("");
        properties.setPassword("");

        databaseConfig.postProcessBeforeInitialization(properties, "dataSourceProperties");

        assertThat(properties.getUrl()).isEqualTo("jdbc:postgresql://ep-cool-river-12345.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
        assertThat(properties.getUsername()).isEqualTo("neonuser");
        assertThat(properties.getPassword()).isEqualTo("neonpass");
    }

    @Test
    @DisplayName("Extracts credentials and removes user info from jdbc:postgresql:// URL")
    void extractsCredentialsFromJdbcPostgresqlUrl() {
        properties.setUrl("jdbc:postgresql://admin:supersecret@ep-cool-river-12345.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
        properties.setUsername(null);
        properties.setPassword(null);

        databaseConfig.postProcessBeforeInitialization(properties, "dataSourceProperties");

        assertThat(properties.getUrl()).isEqualTo("jdbc:postgresql://ep-cool-river-12345.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
        assertThat(properties.getUsername()).isEqualTo("admin");
        assertThat(properties.getPassword()).isEqualTo("supersecret");
    }

    @Test
    @DisplayName("Decodes URL encoded special characters in passwords")
    void decodesUrlEncodedPassword() {
        properties.setUrl("postgresql://appuser:p%40ss%21word%2B123@ep-test.neon.tech/neondb");

        databaseConfig.postProcessBeforeInitialization(properties, "dataSourceProperties");

        assertThat(properties.getUsername()).isEqualTo("appuser");
        assertThat(properties.getPassword()).isEqualTo("p@ss!word+123");
        assertThat(properties.getUrl()).contains("sslmode=require");
    }

    @Test
    @DisplayName("Strips enclosing quotes from username and password")
    void stripsEnclosingQuotes() {
        properties.setUrl("jdbc:postgresql://ep-cool-river-12345.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");
        properties.setUsername("\"myuser\"");
        properties.setPassword("'mypassword'");

        databaseConfig.postProcessBeforeInitialization(properties, "dataSourceProperties");

        assertThat(properties.getUsername()).isEqualTo("myuser");
        assertThat(properties.getPassword()).isEqualTo("mypassword");
    }

    @Test
    @DisplayName("Leaves non-PostgreSQL datasources like H2 untouched")
    void leavesH2Untouched() {
        properties.setUrl("jdbc:h2:mem:resumeiq-test;DB_CLOSE_DELAY=-1");
        properties.setUsername("sa");
        properties.setPassword("");

        databaseConfig.postProcessBeforeInitialization(properties, "dataSourceProperties");

        assertThat(properties.getUrl()).isEqualTo("jdbc:h2:mem:resumeiq-test;DB_CLOSE_DELAY=-1");
        assertThat(properties.getUsername()).isEqualTo("sa");
        assertThat(properties.getPassword()).isEqualTo("");
    }
}
