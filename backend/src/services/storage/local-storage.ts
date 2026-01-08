import { StorageService } from './types';
import fs from 'fs/promises';
import path from 'path';
import { environment } from '../../config/environment';

/**
 * 本地文件系统存储服务
 * 适用于单机部署或开发环境
 */
export class LocalStorageService implements StorageService {
    private uploadDir: string;
    private baseUrl: string;

    constructor() {
        // 从环境变量读取配置，默认存储在 backend/uploads
        this.uploadDir = environment.localStorage?.uploadDir || path.join(process.cwd(), 'uploads');
        this.baseUrl = environment.localStorage?.baseUrl || `http://localhost:${environment.port}`;
    }

    async uploadFile(buffer: Buffer, filename: string, contentType: string, tenantId?: string): Promise<string> {
        // 确保上传目录存在
        await fs.mkdir(this.uploadDir, { recursive: true });

        // 如果提供了 tenantId，按用户组织文件
        const userDir = tenantId ? path.join(this.uploadDir, tenantId) : this.uploadDir;
        await fs.mkdir(userDir, { recursive: true });

        // 生成唯一文件名（添加时间戳避免冲突）
        const timestamp = Date.now();
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext);
        const uniqueFilename = `${basename}-${timestamp}${ext}`;

        const filePath = path.join(userDir, uniqueFilename);

        // 写入文件
        await fs.writeFile(filePath, buffer);

        // 返回公开访问 URL
        const relativePath = tenantId ? `${tenantId}/${uniqueFilename}` : uniqueFilename;
        return this.getPublicUrl(relativePath);
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            // 从 URL 中提取文件名
            const filename = path.basename(new URL(fileUrl).pathname);
            const filePath = path.join(this.uploadDir, filename);

            // 删除文件
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Failed to delete file:', error);
            // 不抛出错误，因为文件可能已经不存在
        }
    }

    getPublicUrl(filePath: string): string {
        return `${this.baseUrl}/uploads/${filePath}`;
    }
}
