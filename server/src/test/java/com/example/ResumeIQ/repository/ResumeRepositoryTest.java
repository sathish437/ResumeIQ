package com.example.ResumeIQ.repository;

import com.example.ResumeIQ.domain.ResumeDocument;
import com.example.ResumeIQ.domain.ResumeSegment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class ResumeRepositoryTest {

    @TempDir
    Path tempDir;

    @Test
    void storesAndLoadsResumeWithItsSegments() {
        ResumeRepository repository = repositoryFor("jdbc:h2:mem:resume-repo-test;DB_CLOSE_DELAY=-1");

        repository.save(resume("resume-1"));

        Optional<ResumeDocument> loaded = repository.findById("resume-1");
        assertThat(loaded).isPresent();
        ResumeDocument document = loaded.get();
        assertThat(document.filename()).isEqualTo("resume.pdf");
        assertThat(document.fileType()).isEqualTo("PDF");
        assertThat(document.status()).isEqualTo("SUCCESS");
        assertThat(document.characterCount()).isEqualTo(42);
        assertThat(document.text()).contains("Jane Doe").contains("billing platform");
        assertThat(document.createdAt()).isEqualTo(Instant.parse("2026-10-21T10:15:30Z"));
        assertThat(document.segments())
                .extracting(ResumeSegment::reference)
                .containsExactly("Page 1", "Page 2");
        assertThat(document.segments().get(1).text()).contains("billing platform");
        assertThat(document.segments().get(1).index()).isEqualTo(2);
    }

    @Test
    void returnsEmptyForAnUnknownResumeId() {
        ResumeRepository repository = repositoryFor("jdbc:h2:mem:resume-repo-empty;DB_CLOSE_DELAY=-1");

        assertThat(repository.findById("does-not-exist")).isEmpty();
    }

    @Test
    void keepsTheResumeAvailableAfterAnApplicationRestart() {
        String url = "jdbc:h2:file:"
                + tempDir.resolve("resumeiq").toAbsolutePath().toString().replace('\\', '/')
                + ";DB_CLOSE_ON_EXIT=FALSE";

        repositoryFor(url).save(resume("resume-1"));

        // A brand new data source and repository over the same file stands in
        // for an application restart.
        ResumeRepository afterRestart = new ResumeRepository(new JdbcTemplate(dataSource(url)));

        Optional<ResumeDocument> loaded = afterRestart.findById("resume-1");
        assertThat(loaded).isPresent();
        assertThat(loaded.get().text()).contains("billing platform");
        assertThat(loaded.get().segments()).hasSize(2);
    }

    private ResumeRepository repositoryFor(String url) {
        DataSource dataSource = dataSource(url);
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(new ClassPathResource("schema.sql"));
        populator.execute(dataSource);
        return new ResumeRepository(new JdbcTemplate(dataSource));
    }

    private DataSource dataSource(String url) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.h2.Driver");
        dataSource.setUrl(url);
        dataSource.setUsername("sa");
        dataSource.setPassword("");
        return dataSource;
    }

    private ResumeDocument resume(String id) {
        return new ResumeDocument(
                id,
                "resume.pdf",
                "PDF",
                "SUCCESS",
                42,
                List.of(ResumeSegment.page(1, "Jane Doe\nJava Developer"),
                        ResumeSegment.page(2, "Projects: billing platform")),
                "Jane Doe\nJava Developer\nProjects: billing platform",
                Instant.parse("2026-10-21T10:15:30Z"));
    }
}
