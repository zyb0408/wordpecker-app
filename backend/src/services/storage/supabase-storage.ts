import { StorageService } from './types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../config/environment';

/**
 * Supabase Storage 存储服务
 * 适用于使用 Supabase 作为后端的项目
 */
export class SupabaseStorageService implements StorageService {
    private client: SupabaseClient;
    private bucket: string;

    constructor() {
        const config = environment.supabaseStorage;

        if (!config?.url || !config?.serviceKey || !config?.bucket) {
            throw new Error('Supabase Storage configuration is incomplete. Please check environment variables.');
        }

        this.bucket = config.bucket;
        this.client = createClient(config.url, config.serviceKey);
    }

    async uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
        // 生成唯一的文件路径
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const filePath = `wordpecker/images/${timestamp}-${randomStr}-${filename}`;

        try {
            // 上传到 Supabase Storage
            const { data, error } = await this.client.storage
                .from(this.bucket)
                .upload(filePath, buffer, {
                    contentType,
                    cacheControl: '31536000', // 缓存一年
                    upsert: false,
                });

            if (error) {
                console.error('Supabase upload error:', error);
                throw new Error(`Failed to upload file to Supabase: ${error.message}`);
            }

            // 返回公开访问 URL
            return this.getPublicUrl(data.path);
        } catch (error) {
            console.error('Supabase upload failed:', error);
            throw new Error('Failed to upload file to Supabase Storage');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // 从 URL 中提取文件路径
            const url = new URL(fileUrl);
            const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);

            if (!pathMatch) {
                console.error('Invalid Supabase Storage URL:', fileUrl);
                return;
            }

            const filePath = pathMatch[1];

            const { error } = await this.client.storage
                .from(this.bucket)
                .remove([filePath]);

            if (error) {
                console.error('Failed to delete file from Supabase:', error);
            }
        } catch (error) {
            console.error('Failed to delete file from Supabase:', error);
            // 不抛出错误
        }
    }

    getPublicUrl(filePath: string): string {
        const { data } = this.client.storage
            .from(this.bucket)
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
}
