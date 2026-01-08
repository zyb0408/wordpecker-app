-- WordPecker v3.0 PostgreSQL 数据库迁移脚本
-- 支持多租户架构（通过 tenant_id 字段区分用户数据）

-- 1. 创建租户表（实际作为用户表使用）
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 唯一标识符
    name VARCHAR(255) NOT NULL,                    -- 用户姓名
    email VARCHAR(255) UNIQUE,                     -- 电子邮箱（唯一）
    password_hash VARCHAR(255),                    -- 加密后的密码
    domain VARCHAR(255) UNIQUE,                    -- 专属域名（可选）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 2. 创建单词列表表 (Word Lists)
CREATE TABLE IF NOT EXISTS word_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- 列表 ID
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE, -- 所属租户 ID
    name VARCHAR(255) NOT NULL,                    -- 列表名称
    description TEXT,                              -- 列表描述
    context TEXT,                                  -- 背景语境（用于 AI 生成相关内容）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建基础单词表 (Words)
-- 该表存储唯一的单词字符串，通过 tenant_id 实现隔离
CREATE TABLE IF NOT EXISTS words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,                    -- 单词文本（如 "apple"）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, value)                         -- 每个租户下的单词文本必须唯一
);

-- 4. 创建单词语境/详细信息表 (Word Contexts)
-- 用于建立单词与特定列表的关系，并存储在该语境下的含义及学习进度
CREATE TABLE IF NOT EXISTS word_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,     -- 关联单词 ID
    list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE, -- 关联列表 ID
    meaning TEXT NOT NULL,                                            -- 在此列表中的含义
    learned_point INTEGER DEFAULT 0 CHECK (learned_point >= 0 AND learned_point <= 100), -- 学习熟练度 (0-100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word_id, list_id)                                          -- 每个单词在每个列表中只能有一条记录
);

-- 5. 创建学习会话表 (Sessions)
-- 记录用户的学习或测试足迹
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('learn', 'quiz')),               -- 会话类型：学习(learn) 或 测试(quiz)
    score INTEGER DEFAULT 0,                                          -- 分数（测试时使用）
    current_exercise_index INTEGER DEFAULT 0,                         -- 当前进行的练习索引
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE                             -- 完成时间
);

-- 6. 创建模板表 (Templates)
-- 预置的单词列表供用户克隆使用
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,                                       -- 模板名称
    description TEXT NOT NULL,                                        -- 模板描述
    context TEXT,                                                     -- 模板背景
    category VARCHAR(100) NOT NULL,                                   -- 分类（如：General, Business）
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')), -- 难度：初/中/高级
    clone_count INTEGER DEFAULT 0,                                    -- 被克隆次数
    featured BOOLEAN DEFAULT FALSE,                                   -- 是否为推荐模板
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. 创建模板单词表 (Template Words)
CREATE TABLE IF NOT EXISTS template_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,                                      -- 单词文本
    meaning TEXT NOT NULL                                             -- 单词含义
);

-- 8. 创建模板标签表 (Template Tags)
CREATE TABLE IF NOT EXISTS template_tags (
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,                                         -- 标签名称
    PRIMARY KEY (template_id, tag)
);

-- 多租户性能优化索引
-- 为经常按租户过滤的表添加索引
CREATE INDEX idx_word_lists_tenant ON word_lists(tenant_id);
CREATE INDEX idx_words_tenant ON words(tenant_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);

-- 测试/演示数据
-- 演示用户 demo@example.com 的密码为 'password123' (已哈希)
INSERT INTO tenants (id, name, email, password_hash, domain) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '默认用户', 'demo@example.com', '$2b$10$L6vYpG.vX7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG', 'default.wordpecker.com'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '教育机构', 'edu@example.com', '$2b$10$L6vYpG.vX7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG7.zG', 'edu.wordpecker.com');

-- 插入示例模板：基础英语
INSERT INTO templates (id, name, description, category, difficulty, featured) VALUES
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '基础英语', '适合初学者的常见英语单词', '通用', 'beginner', true);

-- 插入模板单词
INSERT INTO template_words (template_id, value, meaning) VALUES
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Apple', '苹果：一种果皮通常为红色或绿色的圆形水果'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Banana', '香蕉：一种长形的弯曲水果，成熟时为黄色');

-- 插入多租户测试数据
-- 默认用户的第一个列表
INSERT INTO word_lists (id, tenant_id, name, description) VALUES
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '我的第一个词库', '为默认租户创建的列表'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '校园词汇', '为教育机构创建的列表');

-- 插入单词
INSERT INTO words (id, tenant_id, value) VALUES
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Persistence'),
('06eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Curriculum');

-- 插入单词含义及学习进度
INSERT INTO word_contexts (word_id, list_id, meaning, learned_point) VALUES
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', '毅力：即使遇到困难仍坚持下去的品质', 50),
('06eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', '课程：学校或学院的学习课程组成部分', 20);

-- 9. 创建租户偏好设置表 (Tenant Preferences)
CREATE TABLE IF NOT EXISTS tenant_preferences (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    -- 练习类型开关，以 JSONB 格式存储
    exercise_types JSONB DEFAULT '{"multiple_choice": true, "fill_blank": true, "matching": true, "true_false": true, "sentence_completion": true}',
    base_language VARCHAR(10) DEFAULT 'en',                            -- 母语
    target_language VARCHAR(10) DEFAULT 'en',                          -- 目标语言
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 为测试租户插入默认偏好设置
INSERT INTO tenant_preferences (tenant_id) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

-- 10. 创建图片描述练习表 (Image Description Exercises)
-- 用于记录基于图片的口语/写作练习数据
CREATE TABLE IF NOT EXISTS image_description_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    context TEXT NOT NULL,                                            -- 练习背景
    image_url TEXT NOT NULL,                                          -- 图片链接
    image_alt TEXT,                                                   -- 图片替代文本
    user_description TEXT NOT NULL,                                   -- 用户的描述文本
    analysis JSONB NOT NULL,                                          -- AI 对用户描述的分析结果
    recommended_words JSONB NOT NULL,                                  -- AI 推荐的单词同步
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 为图片练习添加租户索引
CREATE INDEX idx_image_exercises_tenant ON image_description_exercises(tenant_id);
