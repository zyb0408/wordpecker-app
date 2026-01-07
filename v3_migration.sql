-- WordPecker v3.0 PostgreSQL Migration Script
-- Supports Multi-tenancy via tenant_id field

-- 1. Create Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Word Lists Table
CREATE TABLE IF NOT EXISTS word_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Words Table
CREATE TABLE IF NOT EXISTS words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, value)
);

-- 4. Create Word Contexts (Relationship between Words and Lists)
CREATE TABLE IF NOT EXISTS word_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
    meaning TEXT NOT NULL,
    learned_point INTEGER DEFAULT 0 CHECK (learned_point >= 0 AND learned_point <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word_id, list_id)
);

-- 5. Create Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('learn', 'quiz')),
    score INTEGER DEFAULT 0,
    current_exercise_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Create Templates Table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    context TEXT,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    clone_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Template Words Table
CREATE TABLE IF NOT EXISTS template_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    meaning TEXT NOT NULL
);

-- 8. Create Template Tags Table
CREATE TABLE IF NOT EXISTS template_tags (
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (template_id, tag)
);

-- Indexes for Multi-tenancy performance
CREATE INDEX idx_word_lists_tenant ON word_lists(tenant_id);
CREATE INDEX idx_words_tenant ON words(tenant_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);

-- Sample Data for Testing
INSERT INTO tenants (id, name, domain) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Default Tenant', 'default.wordpecker.com'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Education Org', 'edu.wordpecker.com');

INSERT INTO templates (id, name, description, category, difficulty, featured) VALUES
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Basic English', 'Common English words for beginners', 'General', 'beginner', true);

INSERT INTO template_words (template_id, value, meaning) VALUES
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Apple', 'A round fruit with red or green skin'),
('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Banana', 'A long curved fruit which is yellow when ripe');

-- Additional Test Data for Multi-tenancy
INSERT INTO word_lists (id, tenant_id, name, description) VALUES
('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'My First List', 'A list for the default tenant'),
('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'School Vocabulary', 'A list for the education org');

INSERT INTO words (id, tenant_id, value) VALUES
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Persistence'),
('06eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Curriculum');

INSERT INTO word_contexts (word_id, list_id, meaning, learned_point) VALUES
('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'The quality that allows someone to continue doing something even though it is difficult', 50),
('06eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'The subjects comprising a course of study in a school or college', 20);

-- 9. Create Tenant Preferences Table
CREATE TABLE IF NOT EXISTS tenant_preferences (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    exercise_types JSONB DEFAULT '{"multiple_choice": true, "fill_blank": true, "matching": true, "true_false": true, "sentence_completion": true}',
    base_language VARCHAR(10) DEFAULT 'en',
    target_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default preferences for test tenants
INSERT INTO tenant_preferences (tenant_id) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');

-- 10. Create Image Description Exercises Table
CREATE TABLE IF NOT EXISTS image_description_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    context TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_alt TEXT,
    user_description TEXT NOT NULL,
    analysis JSONB NOT NULL,
    recommended_words JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_image_exercises_tenant ON image_description_exercises(tenant_id);
