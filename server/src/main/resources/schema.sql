CREATE TABLE IF NOT EXISTS app_user (
    id              VARCHAR(64)  NOT NULL PRIMARY KEY,
    google_id       VARCHAR(128) NOT NULL UNIQUE,
    email           VARCHAR(256) NOT NULL UNIQUE,
    name            VARCHAR(256) NOT NULL,
    picture_url     VARCHAR(1024),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    last_login_at   TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_session (
    token           VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id         VARCHAR(64)  NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES app_user (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_session_token ON user_session (token);
CREATE INDEX IF NOT EXISTS idx_user_session_user ON user_session (user_id);

CREATE TABLE IF NOT EXISTS resume (
    id              VARCHAR(64)  NOT NULL PRIMARY KEY,
    user_id         VARCHAR(64)  REFERENCES app_user (id) ON DELETE CASCADE,
    filename        VARCHAR(512) NOT NULL,
    file_type       VARCHAR(32)  NOT NULL,
    status          VARCHAR(32)  NOT NULL,
    character_count INTEGER     NOT NULL,
    segment_count   INTEGER     NOT NULL,
    full_text       TEXT        NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE resume ADD COLUMN IF NOT EXISTS user_id VARCHAR(64) REFERENCES app_user (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_resume_user_created ON resume (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS resume_segment (
    resume_id       VARCHAR(64)  NOT NULL,
    reference_label VARCHAR(64) NOT NULL,
    segment_index   INTEGER     NOT NULL,
    segment_text    TEXT        NOT NULL,
    PRIMARY KEY (resume_id, reference_label),
    CONSTRAINT fk_resume_segment_resume FOREIGN KEY (resume_id) REFERENCES resume (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS SPRING_AI_CHAT_MEMORY (
    conversation_id VARCHAR(64) NOT NULL,
    content         TEXT NOT NULL,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')),
    "timestamp"     TIMESTAMP NOT NULL,
    sequence_id     BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS SPRING_AI_CHAT_MEMORY_CONV_TS_IDX
ON SPRING_AI_CHAT_MEMORY(conversation_id, "timestamp");

CREATE INDEX IF NOT EXISTS SPRING_AI_CHAT_MEMORY_CONV_SEQ_IDX
ON SPRING_AI_CHAT_MEMORY(conversation_id, sequence_id);

CREATE TABLE IF NOT EXISTS resume_analysis (
    resume_id       VARCHAR(64)  NOT NULL PRIMARY KEY,
    summary         TEXT         NOT NULL,
    skills_json     TEXT         NOT NULL,
    projects_json   TEXT         NOT NULL,
    education_json  TEXT         NOT NULL,
    missing_info    TEXT         NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_resume_analysis_resume FOREIGN KEY (resume_id) REFERENCES resume (id) ON DELETE CASCADE
);
