# WordPecker v3.0 部署文档 (PostgreSQL + 多租户)

本文档介绍了如何部署升级后的 WordPecker v3.0。此版本已从 MongoDB 迁移到 PostgreSQL，并支持多租户架构。

## 1. 环境要求
- Node.js 18+
- PostgreSQL 14+
- OpenAI API Key (用于 AI 功能)
- ElevenLabs API Key (可选，用于语音功能)

## 2. 数据库设置
1. 安装并启动 PostgreSQL。
2. 创建一个新的数据库：
   ```sql
   CREATE DATABASE wordpecker;
   ```
3. 执行项目根目录下的 `v3_migration.sql` 脚本来初始化表结构和测试数据：
   ```bash
   psql -d wordpecker -f v3_migration.sql
   ```

## 3. 环境变量配置
在 `backend` 目录下创建 `.env` 文件：
```env
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql://user:password@localhost:5432/wordpecker
JWT_SECRET=your_super_secret_key
# 可选
ELEVENLABS_API_KEY=your_elevenlabs_key
```

## 4. 后端部署
1. 进入后端目录：
   ```bash
   cd backend
   ```
2. 安装依赖：
   ```bash
   pnpm install
   ```
3. 编译并启动：
   ```bash
   pnpm build
   pnpm start
   ```

## 5. 前端部署
1. 进入前端目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   pnpm install
   ```
3. 构建生产版本：
   ```bash
   pnpm build
   ```
4. 使用 Nginx 或其他静态托管服务部署 `dist` 目录。

## 6. 多租户使用说明
系统支持两种方式识别租户：

### 方式 A：JWT Token (推荐)
在 `Authorization` Header 中携带 Bearer Token：
`Authorization: Bearer <your_jwt_token>`

Token 的 Payload 必须包含 `tenantId` 字段：
```json
{
  "tenantId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "exp": 1735689600
}
```

### 方式 B：自定义 Header (开发测试)
使用 `x-tenant-id` Header 直接传递租户 ID：
`x-tenant-id: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`

- 在 `development` 模式下，如果未提供上述信息，系统默认使用 `Default Tenant`。
- 在 `production` 模式下，未提供身份验证信息将返回 401 错误。

## 7. 数据库架构说明
- `tenants`: 存储租户信息。
- `word_lists`: 单词本，通过 `tenant_id` 隔离。
- `words`: 单词库，通过 `tenant_id` 隔离。
- `word_contexts`: 单词在特定单词本中的含义和掌握程度。
- `sessions`: 记录学习和测试会话，通过 `tenant_id` 隔离。
- `templates`: 公共模板，不区分租户。
- `tenant_preferences`: 租户偏好设置。
