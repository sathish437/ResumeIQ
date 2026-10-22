package com.example.ResumeIQ.config;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

/**
 * Application-level upload limits. These complement the servlet multipart
 * limits configured in application.properties.
 *
 * @param maxFileSize maximum size allowed for a single uploaded document
 */
@Validated
@ConfigurationProperties(prefix = "app.upload")
public record UploadProperties(@NotNull @DefaultValue("10MB") DataSize maxFileSize) {
}
