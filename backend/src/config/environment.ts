import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'DATABASE_URL', 'JWT_SECRET'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const environment = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY!,
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,

  // Storage configuration
  storageProvider: process.env.STORAGE_PROVIDER || 'local', // 'local' | 'oss' | 'supabase'

  // Local storage config
  localStorage: {
    uploadDir: process.env.LOCAL_UPLOAD_DIR,
    baseUrl: process.env.LOCAL_BASE_URL,
  },

  // Aliyun OSS config
  ossStorage: {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
    region: process.env.OSS_REGION,
    cdnDomain: process.env.OSS_CDN_DOMAIN, // Optional
  },

  // Supabase Storage config
  supabaseStorage: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'wordpecker-images',
  },
} as const;

