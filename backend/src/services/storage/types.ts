/**
 * 统一的存储服务接口
 * 支持本地存储、阿里云 OSS 和 Supabase Storage
 */

export interface StorageService {
    /**
     * 上传文件
     * @param buffer 文件内容
     * @param filename 文件名
     * @param contentType MIME 类型
     * @returns 文件的公开访问 URL
     */
    uploadFile(buffer: Buffer, filename: string, contentType: string): Promise<string>;

    /**
     * 删除文件
     * @param fileUrl 文件 URL 或路径
     */
    deleteFile(fileUrl: string): Promise<void>;

    /**
     * 获取文件的公开访问 URL
     * @param filePath 文件路径
     */
    getPublicUrl(filePath: string): string;
}

export type StorageProvider = 'local' | 'oss' | 'supabase';
