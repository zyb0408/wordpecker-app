# 图片存储配置指南

WordPecker 支持三种图片存储方式，你可以根据部署环境和需求选择最合适的方案。

## 📦 存储方式对比

| 特性 | 本地存储 | 阿里云 OSS | Supabase Storage |
|------|---------|-----------|------------------|
| **适用场景** | 开发环境、单机部署 | 生产环境、高流量 | Supabase 用户 |
| **成本** | 免费（服务器存储） | 按量计费 | 免费额度 + 按量计费 |
| **CDN 加速** | ❌ | ✅ | ✅ |
| **扩展性** | 受限于服务器 | 无限扩展 | 无限扩展 |
| **配置难度** | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐ 中等 |

---

## 1️⃣ 本地存储（默认）

### 适用场景
- 开发和测试环境
- 单机部署
- 流量较小的个人项目

### 配置步骤

在 `backend/.env` 中添加：

```bash
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:3000
```

### 参数说明
- `STORAGE_PROVIDER`: 设置为 `local`
- `LOCAL_UPLOAD_DIR`: 文件存储目录（相对或绝对路径）
- `LOCAL_BASE_URL`: 服务器的公开访问地址

### 注意事项
- 文件存储在 `backend/uploads/` 目录
- 需要确保该目录有写入权限
- 如果使用 Docker 部署，需要挂载 volume 持久化数据
- 不支持多服务器负载均衡（文件只在单台服务器上）

---

## 2️⃣ 阿里云 OSS

### 适用场景
- 生产环境
- 需要 CDN 加速
- 高并发访问
- 多地域部署

### 配置步骤

#### Step 1: 创建 OSS Bucket
1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket，选择合适的地域
3. 设置读写权限为 **公共读**
4. （可选）配置 CDN 加速域名

#### Step 2: 获取访问凭证
1. 访问 [RAM 访问控制](https://ram.console.aliyun.com/)
2. 创建 RAM 用户，授予 `AliyunOSSFullAccess` 权限
3. 生成 AccessKey ID 和 AccessKey Secret

#### Step 3: 配置环境变量

在 `backend/.env` 中添加：

```bash
STORAGE_PROVIDER=oss

# 阿里云 OSS 配置
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your-bucket-name
OSS_REGION=oss-cn-hangzhou
OSS_CDN_DOMAIN=cdn.yourdomain.com  # 可选：自定义 CDN 域名
```

### 参数说明
- `OSS_ACCESS_KEY_ID`: RAM 用户的 AccessKey ID
- `OSS_ACCESS_KEY_SECRET`: RAM 用户的 AccessKey Secret
- `OSS_BUCKET`: Bucket 名称
- `OSS_REGION`: Bucket 所在地域（如 `oss-cn-hangzhou`、`oss-cn-beijing`）
- `OSS_CDN_DOMAIN`: （可选）CDN 加速域名

### 地域代码参考
- 华东1（杭州）：`oss-cn-hangzhou`
- 华北2（北京）：`oss-cn-beijing`
- 华南1（深圳）：`oss-cn-shenzhen`
- 更多地域：[OSS 地域列表](https://help.aliyun.com/document_detail/31837.html)

### 成本估算
- 存储费用：约 ¥0.12/GB/月
- 流量费用：约 ¥0.50/GB（外网流出）
- CDN 流量：约 ¥0.24/GB

---

## 3️⃣ Supabase Storage

### 适用场景
- 已使用 Supabase 作为数据库
- 需要统一的后端服务
- 希望简化配置

### 配置步骤

#### Step 1: 创建 Storage Bucket
1. 登录 [Supabase Dashboard](https://app.supabase.com/)
2. 进入你的项目
3. 点击左侧菜单 **Storage**
4. 创建新 Bucket，命名为 `wordpecker-images`
5. 设置为 **Public bucket**（允许公开访问）

#### Step 2: 获取 API 凭证
1. 进入 **Settings** → **API**
2. 复制 **Project URL** 和 **service_role key**

#### Step 3: 配置环境变量

在 `backend/.env` 中添加：

```bash
STORAGE_PROVIDER=supabase

# Supabase Storage 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=wordpecker-images
```

### 参数说明
- `SUPABASE_URL`: 项目的 API URL
- `SUPABASE_SERVICE_KEY`: Service Role Key（注意：不是 anon key）
- `SUPABASE_STORAGE_BUCKET`: Storage Bucket 名称

### 免费额度
- 存储空间：1GB
- 带宽：2GB/月
- 超出后按量计费

---

## 🔄 切换存储方式

只需修改 `STORAGE_PROVIDER` 环境变量，无需修改代码：

```bash
# 使用本地存储
STORAGE_PROVIDER=local

# 使用阿里云 OSS
STORAGE_PROVIDER=oss

# 使用 Supabase
STORAGE_PROVIDER=supabase
```

重启后端服务即可生效。

---

## 🛠️ 故障排查

### 本地存储问题
- **文件无法访问**：检查 `LOCAL_BASE_URL` 是否正确
- **权限错误**：确保 `uploads` 目录有写入权限

### OSS 问题
- **上传失败**：检查 AccessKey 是否正确，RAM 用户是否有权限
- **图片无法访问**：确认 Bucket 权限设置为公共读
- **跨域错误**：在 OSS 控制台配置 CORS 规则

### Supabase 问题
- **上传失败**：确认使用的是 `service_role` key，不是 `anon` key
- **图片无法访问**：检查 Bucket 是否设置为 Public
- **超出配额**：查看 Supabase Dashboard 的使用情况

---

## 📚 更多资源

- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [项目 GitHub](https://github.com/zyb0408/wordpecker-app)
