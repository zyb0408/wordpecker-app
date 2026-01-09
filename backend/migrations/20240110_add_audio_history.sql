-- 添加音频历史记录表
CREATE TABLE IF NOT EXISTS audio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    text TEXT NOT NULL,                                               -- 朗读的文本
    audio_url TEXT NOT NULL,                                          -- 持久化存储后的 URL
    voice_id TEXT,                                                   -- 使用的声音 ID
    language_code VARCHAR(10),                                        -- 语言代码
    source_type VARCHAR(50),                                          -- 来源（word_pronunciation, sentence, custom 等）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 为租户 ID 添加索引，优化查询速度
CREATE INDEX IF NOT EXISTS idx_audio_history_tenant ON audio_history(tenant_id);

-- 添加注释说明
COMMENT ON TABLE audio_history IS '存储用户生成的语音音频历史记录，支持多租户隔离';
