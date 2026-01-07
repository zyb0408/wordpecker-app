# WordPecker v3.0 永久云端部署指南

本指南将协助您将应用部署到云端（Vercel + Railway + Supabase），实现永久在线。

## 1. 数据库部署 (Supabase)
1. 访问 [Supabase](https://supabase.com/) 并创建一个新项目。
2. 进入 **SQL Editor**，将项目根目录下的 `v3_migration.sql` 内容粘贴并运行。
3. 在 **Project Settings > Database** 中获取 `Connection string` (URI 格式)。

## 2. 后端部署 (Railway)
1. 访问 [Railway](https://railway.app/)，点击 **New Project > Deploy from GitHub repo**。
2. 选择 `wordpecker-app` 仓库，设置 Root Directory 为 `backend`。
3. 在 **Variables** 中添加以下环境变量：
   - `DATABASE_URL`: 填入第一步获取的 Supabase 连接字符串。
   - `JWT_SECRET`: 您的随机密钥。
   - `OPENAI_API_KEY`: 您的 OpenAI API Key。
   - `PORT`: `3000` (Railway 会自动分配，通常不需要手动设)。
   - `NODE_ENV`: `production`

## 3. 前端部署 (Vercel)
1. 访问 [Vercel](https://vercel.com/)，点击 **Add New > Project**。
2. 导入 `wordpecker-app` 仓库，设置 Root Directory 为 `frontend`。
3. 在 **Environment Variables** 中添加：
   - `VITE_API_URL`: 填入第二步部署好的 Railway 后端域名（例如 `https://wordpecker-backend.up.railway.app`）。

## 4. 自动化部署 (GitHub Secrets)
为了让 GitHub Actions 正常工作，请在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加以下 Secrets：
- `RAILWAY_TOKEN`: 在 Railway 账号设置中生成。
- `VERCEL_TOKEN`: 在 Vercel 账号设置中生成。
- `VERCEL_ORG_ID`: Vercel 项目配置中获取。
- `VERCEL_PROJECT_ID`: Vercel 项目配置中获取。

---
**恭喜！** 完成以上步骤后，您的应用将实现永久在线，且每次推送代码都会自动更新。
