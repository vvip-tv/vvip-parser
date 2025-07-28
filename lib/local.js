import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 缓存目录
const CACHE_DIR = path.join(__dirname, '../.cache');

// 本地存储实现
class LocalStorage {
    constructor() {
        this.ensureCacheDir();
    }

    async ensureCacheDir() {
        try {
            await fs.mkdir(CACHE_DIR, { recursive: true });
        } catch (error) {
            console.error('Failed to create cache directory:', error);
        }
    }

    // 生成缓存文件路径
    getCachePath(rule, key) {
        // 将rule和key组合成安全的文件名
        const safeFileName = `${rule}_${key}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(CACHE_DIR, `${safeFileName}.json`);
    }

    // 获取缓存
    async get(rule, key) {
        try {
            const filePath = this.getCachePath(rule, key);
            const data = await fs.readFile(filePath, 'utf8');
            const cached = JSON.parse(data);
            
            // 检查是否过期
            if (cached.expireTime && cached.expireTime < Date.now()) {
                await this.delete(rule, key);
                return null;
            }
            
            return cached.value;
        } catch (error) {
            // 文件不存在或解析失败
            return null;
        }
    }

    // 设置缓存
    async set(rule, key, value, ttl = 0) {
        try {
            await this.ensureCacheDir();
            
            const filePath = this.getCachePath(rule, key);
            const data = {
                value: value,
                createTime: Date.now(),
                expireTime: ttl > 0 ? Date.now() + ttl * 1000 : 0
            };
            
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Failed to set cache:', error);
            return false;
        }
    }

    // 删除缓存
    async delete(rule, key) {
        try {
            const filePath = this.getCachePath(rule, key);
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            // 文件不存在也算删除成功
            return true;
        }
    }

    // 清理过期缓存
    async cleanup() {
        try {
            const files = await fs.readdir(CACHE_DIR);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(CACHE_DIR, file);
                    try {
                        const data = await fs.readFile(filePath, 'utf8');
                        const cached = JSON.parse(data);
                        
                        if (cached.expireTime && cached.expireTime < Date.now()) {
                            await fs.unlink(filePath);
                        }
                    } catch (error) {
                        // 忽略单个文件的错误
                    }
                }
            }
        } catch (error) {
            console.error('Failed to cleanup cache:', error);
        }
    }
}

// 创建单例
const localStorage = new LocalStorage();

// 导出兼容接口
export const local = {
    get: (rule, key) => localStorage.get(rule, key),
    set: (rule, key, value) => localStorage.set(rule, key, value),
    delete: (rule, key) => localStorage.delete(rule, key)
};

// 定期清理过期缓存
setInterval(() => {
    localStorage.cleanup();
}, 60 * 60 * 1000); // 每小时清理一次

export default local;