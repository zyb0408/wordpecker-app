# Storage Configuration Quick Start

## 快速配置示例

### 本地存储（推荐用于开发）

```bash
# backend/.env
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:3000
```

### 阿里云 OSS（推荐用于生产）

```bash
# backend/.env
STORAGE_PROVIDER=oss
OSS_ACCESS_KEY_ID=LTAI5tXXXXXXXXXXXXXX
OSS_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OSS_BUCKET=wordpecker-prod
OSS_REGION=oss-cn-hangzhou
OSS_CDN_DOMAIN=cdn.example.com  # 可选
```

### Supabase Storage

```bash
# backend/.env
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_STORAGE_BUCKET=wordpecker-images
```

## 测试配置

启动后端后，查看日志确认存储服务已正确初始化：

```
📦 Initializing storage service: local
📁 Serving static files from: ./uploads
```

或

```
📦 Initializing storage service: oss
```

或

```
📦 Initializing storage service: supabase
```
