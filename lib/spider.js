import { promises as fs } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve, isAbsolute } from 'path';
import vm from 'vm';
import { http, req, _http } from './http.js';
import { md5X, aesX, rsaX } from './crypto.js';
import { joinUrl, s2t, t2s, getProxy, setTimeout as setTimeoutUtil, clearTimeout, similarity } from './utils.js';
import { local } from './local.js';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Spider基类
export class Spider {
    constructor() {
        this.siteKey = '';
        this.siteType = 0;
        this.module = null;
        this.context = null;
    }

    // 初始化Spider实例
    async init(ext = '') {
        if (this.module && this.module.init) {
            return await this.module.init(ext);
        }
    }

    // 获取首页内容
    async home(filter = true) {
        if (this.module && this.module.home) {
            return await this.module.home(filter);
        }
        return JSON.stringify({ class: [] });
    }

    // 获取首页推荐视频
    async homeVod() {
        if (this.module && this.module.homeVod) {
            return await this.module.homeVod();
        }
        return JSON.stringify({ list: [] });
    }

    // 获取分类内容
    async category(tid, pg = '1', filter = true, extend = {}) {
        if (this.module && this.module.category) {
            return await this.module.category(tid, pg, filter, extend);
        }
        return JSON.stringify({ page: 1, pagecount: 0, list: [] });
    }

    // 获取详情
    async detail(id) {
        if (this.module && this.module.detail) {
            return await this.module.detail(id);
        }
        return JSON.stringify({ list: [] });
    }

    // 搜索
    async search(key, quick = false, pg = '1') {
        if (this.module && this.module.search) {
            return await this.module.search(key, quick, pg);
        }
        return JSON.stringify({ list: [] });
    }

    // 播放
    async play(flag, id, flags = []) {
        if (this.module && this.module.play) {
            return await this.module.play(flag, id, flags);
        }
        return JSON.stringify({ parse: 0, url: '' });
    }

    // 嗅探
    async sniffer() {
        if (this.module && this.module.sniffer) {
            return await this.module.sniffer();
        }
        return false;
    }

    // 是否视频格式
    async isVideo(url) {
        if (this.module && this.module.isVideo) {
            return await this.module.isVideo(url);
        }
        const videoExts = ['.mp4', '.m3u8', '.flv', '.avi', '.mkv', '.mov', '.mp3', '.m4a'];
        return videoExts.some(ext => url.toLowerCase().includes(ext));
    }

    // 代理
    async proxy(params) {
        if (this.module && this.module.proxy) {
            return await this.module.proxy(params);
        }
        return [404, 'text/plain', ''];
    }

    // 动作
    async action(action) {
        if (this.module && this.module.action) {
            return await this.module.action(action);
        }
        return '';
    }

    // 销毁
    async destroy() {
        if (this.module && this.module.destroy) {
            await this.module.destroy();
        }
        this.module = null;
        this.context = null;
    }
}

// 创建沙箱环境
function createSandbox(scriptPath) {
    const sandbox = {
        // 全局对象
        console,
        setTimeout: setTimeoutUtil,
        clearTimeout,
        setInterval: global.setInterval.bind(global),
        clearInterval: global.clearInterval.bind(global),
        
        // HTTP请求
        req,
        http,
        _http,
        
        // 加密工具
        md5X,
        aesX,
        rsaX,
        
        // 工具函数
        joinUrl,
        s2t,
        t2s,
        getProxy,
        similarity,
        
        // 本地存储
        local,
        
        
        // 模块导出
        module: { exports: {} },
        exports: {},
        
        // 全局变量
        global: {},
        globalThis: {},
        
        // 路径信息
        __dirname: dirname(scriptPath),
        __filename: scriptPath
    };
    
    // 让global和globalThis指向sandbox本身
    sandbox.global = sandbox;
    sandbox.globalThis = sandbox;
    
    return sandbox;
}


// 加载ES6模块 (默认且唯一的加载方式)
export async function loadSpider(scriptPath, isUrl = false) {
    const spider = new Spider();
    
    // 读取代码
    let code = '';
    let actualPath = scriptPath;
    
    if (isUrl) {
        const response = await http(scriptPath);
        if (response.ok) {
            code = response.content;
        } else {
            throw new Error(`Failed to load script from URL: ${scriptPath}`);
        }
    } else {
        actualPath = isAbsolute(scriptPath) ? scriptPath : resolve(scriptPath);
        code = await fs.readFile(actualPath, 'utf8');
    }
    
    // 创建沙箱
    const sandbox = createSandbox(actualPath);
    const context = vm.createContext(sandbox);
    
    // 简化的模块链接器 - 支持任意本地模块
    async function linker(specifier) {
        try {
            // 解析相对路径为绝对路径
            let resolvedPath = specifier;
            if (specifier.startsWith('./') || specifier.startsWith('../')) {
                resolvedPath = resolve(dirname(actualPath), specifier);
                resolvedPath = pathToFileURL(resolvedPath).href;
            }
            
            const mod = await import(resolvedPath);
            const exports = Object.keys(mod);
            
            return new vm.SyntheticModule(
                exports,
                function() {
                    for (const name of exports) {
                        this.setExport(name, mod[name]);
                    }
                },
                { context }
            );
        } catch (error) {
            console.warn(`Failed to import ${specifier}: ${error.message}`);
            
            // 返回空模块作为后备
            return new vm.SyntheticModule(
                ['default'],
                function() {
                    this.setExport('default', {});
                },
                { context }
            );
        }
    }
    
    try {
        // 创建 SourceTextModule
        const module = new vm.SourceTextModule(code, {
            identifier: isUrl ? scriptPath : pathToFileURL(actualPath).href,
            context,
            initializeImportMeta(meta, module) {
                meta.url = module.identifier;
            }
        });
        
        // 链接模块
        await module.link(linker);
        
        // 评估模块
        await module.evaluate();
        
        // 获取导出
        const exports = module.namespace;
        
        // 设置爬虫模块
        if (exports.default) {
            spider.module = exports.default;
        } else {
            // 如果没有默认导出，尝试收集所有导出的函数
            const spiderModule = {};
            for (const [key, value] of Object.entries(exports)) {
                if (typeof value === 'function') {
                    spiderModule[key] = value;
                }
            }
            spider.module = spiderModule;
        }
        
        spider.context = context;
        
    } catch (error) {
        console.error('Failed to load spider module:', error);
        throw error;
    }
    
    return spider;
}

// 默认导出
export default {
    Spider,
    loadSpider
};