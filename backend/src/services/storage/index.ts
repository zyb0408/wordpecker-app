import { StorageService, StorageProvider } from './types';
import { LocalStorageService } from './local-storage';
import { OSSStorageService } from './oss-storage';
import { SupabaseStorageService } from './supabase-storage';
import { environment } from '../../config/environment';

/**
 * 存储服务工厂
 * 根据环境变量自动选择合适的存储服务
 */
class StorageServiceFactory {
    private static instance: StorageService | null = null;

    static getStorageService(): StorageService {
        if (this.instance) {
            return this.instance;
        }

        const provider: StorageProvider = (environment.storageProvider as StorageProvider) || 'local';

        console.log(`📦 Initializing storage service: ${provider}`);

        switch (provider) {
            case 'local':
                this.instance = new LocalStorageService();
                break;
            case 'oss':
                this.instance = new OSSStorageService();
                break;
            case 'supabase':
                this.instance = new SupabaseStorageService();
                break;
            default:
                console.warn(`Unknown storage provider: ${provider}, falling back to local storage`);
                this.instance = new LocalStorageService();
        }

        return this.instance;
    }

    /**
     * 重置实例（主要用于测试）
     */
    static reset(): void {
        this.instance = null;
    }
}

// 导出单例
export const storageService = StorageServiceFactory.getStorageService();
