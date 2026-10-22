package com.example.ResumeIQ.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;

import static org.assertj.core.api.Assertions.assertThat;

class DotenvLoaderTest {

    @Test
    @DisplayName("DotenvLoader loads variables from .env file into system properties")
    void loadsDotenv() {
        DotenvLoader.load();

        File envFile = new File(".env");
        if (envFile.exists()) {
            assertThat(System.getProperty("GEMINI_MODEL")).isEqualTo("gemini-2.5-flash");
            assertThat(System.getProperty("DATABASE_URL")).isNotBlank();
        }
    }
}
