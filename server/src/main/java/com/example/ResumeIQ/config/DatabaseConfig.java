package com.example.ResumeIQ.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;
import org.springframework.stereotype.Component;

import java.net.URI;

/**
 * Normalizes PostgreSQL datasource configuration.
 * - Converts Neon's postgresql:// URI format into jdbc:postgresql://
 * - Preserves sslmode=require and removes libpq-only parameters (channel_binding)
 * - Extracts username and password from the URL if not provided via DB_USERNAME/DB_PASSWORD
 * - Checks environment variable fallbacks (DB_PASSWORD, DATABASE_PASSWORD, PGPASSWORD)
 */
@Component
public class DatabaseConfig implements BeanPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSourceProperties properties) {
            normalizeDataSourceProperties(properties);
        }
        return bean;
    }

    private void normalizeDataSourceProperties(DataSourceProperties properties) {
        String url = properties.getUrl();
        if (url == null || url.isBlank()) {
            return;
        }

        String trimmed = url.strip();
        boolean isPostgreSql = trimmed.startsWith("postgresql://")
                || trimmed.startsWith("postgres://")
                || trimmed.startsWith("jdbc:postgresql://")
                || trimmed.contains("neon.tech");

        if (!isPostgreSql) {
            // Do not alter non-PostgreSQL datasources (such as in-memory H2 used in tests)
            return;
        }

        String workingUrl = trimmed;

        // 1. Extract embedded credentials if present in postgresql://, postgres://, or jdbc:postgresql://
        String prefix = null;
        if (workingUrl.startsWith("postgres://")) {
            prefix = "postgres://";
        } else if (workingUrl.startsWith("postgresql://")) {
            prefix = "postgresql://";
        } else if (workingUrl.startsWith("jdbc:postgresql://")) {
            prefix = "jdbc:postgresql://";
        }

        if (prefix != null) {
            String afterPrefix = workingUrl.substring(prefix.length());
            int atIndex = afterPrefix.lastIndexOf('@');
            if (atIndex > 0) {
                String userInfo = afterPrefix.substring(0, atIndex);
                String remaining = afterPrefix.substring(atIndex + 1);

                int colonIndex = userInfo.indexOf(':');
                String extractedUser;
                String extractedPass = null;
                if (colonIndex >= 0) {
                    extractedUser = userInfo.substring(0, colonIndex);
                    extractedPass = userInfo.substring(colonIndex + 1);
                } else {
                    extractedUser = userInfo;
                }

                if (properties.getUsername() == null || properties.getUsername().isBlank()) {
                    properties.setUsername(decodeUrlComponent(cleanValue(extractedUser)));
                }
                if (extractedPass != null && (properties.getPassword() == null || properties.getPassword().isBlank())) {
                    properties.setPassword(decodeUrlComponent(cleanValue(extractedPass)));
                }

                workingUrl = "jdbc:postgresql://" + remaining;
            } else if (!workingUrl.startsWith("jdbc:postgresql://")) {
                workingUrl = "jdbc:postgresql://" + afterPrefix;
            }
        }

        // 2. Clean query parameters (remove libpq channel_binding, ensure sslmode=require for Neon)
        if (workingUrl.contains("channel_binding=")) {
            workingUrl = workingUrl.replace("&channel_binding=require", "")
                    .replace("channel_binding=require&", "")
                    .replace("channel_binding=require", "");
        }
        if (workingUrl.contains("neon.tech") && !workingUrl.contains("sslmode=")) {
            workingUrl = workingUrl + (workingUrl.contains("?") ? "&" : "?") + "sslmode=require";
        }

        properties.setUrl(workingUrl);

        // 3. Clean up existing username/password (strip enclosing quotes if any)
        if (properties.getUsername() != null && !properties.getUsername().isBlank()) {
            properties.setUsername(cleanValue(properties.getUsername()));
        }
        if (properties.getPassword() != null && !properties.getPassword().isBlank()) {
            properties.setPassword(cleanValue(properties.getPassword()));
        }

        // 4. Fallback to environment variables if password or username is still missing
        if (properties.getPassword() == null || properties.getPassword().isBlank()) {
            String envPass = getFirstEnv("DB_PASSWORD", "DATABASE_PASSWORD", "PGPASSWORD", "POSTGRES_PASSWORD");
            if (envPass != null && !envPass.isBlank()) {
                properties.setPassword(cleanValue(envPass));
            }
        }

        if (properties.getUsername() == null || properties.getUsername().isBlank()) {
            String envUser = getFirstEnv("DB_USERNAME", "DATABASE_USERNAME", "PGUSER", "POSTGRES_USER");
            if (envUser != null && !envUser.isBlank()) {
                properties.setUsername(cleanValue(envUser));
            }
        }

        log.info("PostgreSQL datasource initialized with JDBC URL: {}", sanitizeUrl(properties.getUrl()));
    }

    private String cleanValue(String val) {
        if (val == null) {
            return null;
        }
        String trimmed = val.strip();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\""))
                || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).strip();
        }
        return trimmed;
    }

    private String decodeUrlComponent(String val) {
        if (val == null || !val.contains("%")) {
            return val;
        }
        try {
            // Protect literal '+' from being converted into spaces by URLDecoder
            String protectedVal = val.replace("+", "%2B");
            return java.net.URLDecoder.decode(protectedVal, java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return val;
        }
    }

    private String sanitizeUrl(String url) {
        if (url == null) {
            return "";
        }
        // Prevent printing credentials if present
        int atIndex = url.lastIndexOf('@');
        if (atIndex > 0) {
            int schemeIdx = url.indexOf("://");
            if (schemeIdx > 0) {
                return url.substring(0, schemeIdx + 3) + "***@" + url.substring(atIndex + 1);
            }
        }
        return url;
    }

    private String getFirstEnv(String... names) {
        for (String name : names) {
            String val = System.getenv(name);
            if (val != null && !val.isBlank()) {
                return val;
            }
            val = System.getProperty(name);
            if (val != null && !val.isBlank()) {
                return val;
            }
        }
        return null;
    }
}
