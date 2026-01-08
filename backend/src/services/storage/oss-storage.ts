import { StorageService } from './types';
import OSS from 'ali-oss';
import { environment } from '../../config/environment';

/**
 * 阿里云 OSS 存储服务
 * 适用于生产环境，支持 CDN 加速
 */
export class OSSStorageService implements StorageService {
    private client: OSS;
    private bucket: string;
    private region: string;
    private cdnDomain?: string;

    constructor() {
        const config = environment.ossStorage;

        if (!config?.accessKeyId || !config?.accessKeySecret || !config?.bucket || !config?.region) {
            throw new Error('OSS configuration is incomplete. Please check environment variables.');
        }

        this.bucket = config.bucket;
        this.region = config.region;
        this.cdnDomain = config.cdnDomain;

        this.client = new OSS({
            region: config.region,
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            bucket: config.bucket,
        });
    }

    async uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string> {
        // 生成唯一的对象键（路径）
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const objectKey = `wordpecker/images/${timestamp}-${randomStr}-${filename}`;

        try {
            // 上传到 OSS
            await this.client.put(objectKey, buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000', // 缓存一年
                },
            });

            // 返回公开访问 URL
            return this.getPublicUrl(objectKey);
        } catch (error) {
            console.error('OSS upload failed:', error);
            throw new Error('Failed to upload file to OSS');
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // 从 URL 中提取对象键
            const url = new URL(fileUrl);
            const objectKey = url.pathname.substring(1); // 移除开头的 '/'

            await this.client.delete(objectKey);
        } catch (error) {
            console.error('Failed to delete file from OSS:', error);
            // 不抛出错误
        }
    }

    getPublicUrl(objectKey: string): string {
        // 如果配置了 CDN 域名，使用 CDN
        if (this.cdnDomain) {
            return `https://${this.cdnDomain}/${objectKey}`;
        }

        // 否则使用 OSS 默认域名
        return `https://${this.bucket}.${this.region}.aliyuncs.com/${objectKey}`;
    }
}
