import axios from 'axios';

/**
 * 从 URL 下载图片并返回 Buffer
 * @param imageUrl 图片 URL
 * @returns 图片的 Buffer 和 Content-Type
 */
export async function downloadImage(imageUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30 秒超时
            headers: {
                'User-Agent': 'WordPecker/1.0',
            },
        });

        const buffer = Buffer.from(response.data);
        const contentType = response.headers['content-type'] || 'image/jpeg';

        return { buffer, contentType };
    } catch (error) {
        console.error('Failed to download image:', error);
        throw new Error(`Failed to download image from ${imageUrl}`);
    }
}

/**
 * 从 URL 中提取文件名
 * @param url 图片 URL
 * @returns 文件名
 */
export function extractFilenameFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

        // 如果没有扩展名，添加默认的 .jpg
        if (!filename.includes('.')) {
            return `${filename}.jpg`;
        }

        return filename || 'image.jpg';
    } catch {
        // 如果 URL 解析失败，生成一个随机文件名
        return `image-${Date.now()}.jpg`;
    }
}
