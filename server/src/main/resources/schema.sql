CREATE TABLE IF NOT EXISTS resume (
    id              VARCHAR(64)  NOT NULL PRIMARY KEY,
    filename        VARCHAR(512) NOT NULL,
    file_type       VARCHAR(32)  NOT NULL,
    status          VARCHAR(32)  NOT NULL,
    character_count INTEGER     NOT NULL,
    segment_count   INTEGER     NOT NULL,
    full_text       TEXT        NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS resume_segment (
    resume_id       VARCHAR(64)  NOT NULL,
    reference_label VARCHAR(64) NOT NULL,
    segment_index   INTEGER     NOT NULL,
    segment_text    TEXT        NOT NULL,
    PRIMARY KEY (resume_id, reference_label),
    CONSTRAINT fk_resume_segment_resume FOREIGN KEY (resume_id) REFERENCES resume (id)
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
    CONSTRAINT fk_resume_analysis_resume FOREIGN KEY (resume_id) REFERENCES resume (id)
);
