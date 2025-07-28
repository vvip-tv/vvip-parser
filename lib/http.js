import axios from 'axios';
import deasync from 'deasync';
import { exec } from 'child_process';

// HTTP请求封装，模拟原QuickJS的http模块
class HttpClient {
    constructor() {
        this.axios = axios.create({
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: () => true,
            responseType: 'arraybuffer'
        });
    }

    async request(url, options = {}) {
        try {
            const config = {
                url,
                method: options.method || 'GET',
                headers: this.normalizeHeaders(options.headers || options.header || {}),
                timeout: options.timeout || 30000,
                maxRedirects: options.redirect === false ? 0 : 5,
                responseType: 'text'
            };

            // 处理请求数据
            if (options.data) {
                if (options.postType === 'json') {
                    config.headers['Content-Type'] = 'application/json';
                    config.data = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
                } else if (options.postType === 'form') {
                    config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    config.data = typeof options.data === 'string' ? options.data : new URLSearchParams(options.data).toString();
                } else {
                    config.data = options.data;
                }
            }

            const response = await this.axios(config);
            
            // 构建响应对象
            const result = {
                ok: response.status >= 200 && response.status < 300,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                url: response.config.url,
                redirected: response.request.res && response.request.res.responseUrl !== url
            };

            // 处理响应数据
            if (options.buffer === 2 || options.buffer === 'base64') {
                result.content = Buffer.from(response.data, 'utf-8').toString('base64');
            } else {
                // 默认返回文本（已经是字符串）
                result.content = response.data;
            }

            return result;
        } catch (error) {
            console.error('HTTP request error:', error.message);
            return {
                ok: false,
                status: 500,
                statusText: error.message,
                url,
                content: ''
            };
        }
    }

    normalizeHeaders(headers) {
        const normalized = {};
        for (const [key, value] of Object.entries(headers)) {
            normalized[key] = String(value);
        }
        // 设置默认User-Agent
        if (!normalized['User-Agent'] && !normalized['user-agent']) {
            normalized['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }
        return normalized;
    }

    detectCharset(contentType) {
        if (!contentType) return null;
        const match = contentType.match(/charset=([^;]+)/i);
        return match ? match[1].trim() : null;
    }
}

const httpClient = new HttpClient();

// 同步请求接口（使用deasync包装curl命令）
const syncExec = deasync(exec);

export function req(url, options = {}) {
    try {
        // 构建curl命令
        let curlCmd = 'curl -s -L';
        
        // 添加超时
        const timeout = options.timeout || 30;
        curlCmd += ` --max-time ${timeout}`;
        
        // 添加User-Agent
        const headers = options.headers || options.header || {};
        if (!headers['User-Agent'] && !headers['user-agent']) {
            headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }
        
        // 添加请求头
        for (const [key, value] of Object.entries(headers)) {
            curlCmd += ` -H "${key}: ${value}"`;
        }
        
        // 设置请求方法
        const method = options.method || 'GET';
        if (method !== 'GET') {
            curlCmd += ` -X ${method}`;
        }
        
        // 处理POST数据
        if (options.data) {
            const data = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
            curlCmd += ` --data-raw '${data.replace(/'/g, "\\'")}'`;
            
            if (options.postType === 'json') {
                curlCmd += ` -H "Content-Type: application/json"`;
            } else if (options.postType === 'form') {
                curlCmd += ` -H "Content-Type: application/x-www-form-urlencoded"`;
            }
        }
        
        // 获取状态码和响应
        curlCmd += ` -w "\\n---STATUS---%{http_code}---"`;
        curlCmd += ` "${url}"`;
        
        // 执行curl命令
        const result = syncExec(curlCmd);
        
        // 解析响应
        const output = result.toString();
        const statusMatch = output.match(/\n---STATUS---(\d+)---$/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 200;
        const content = statusMatch ? output.substring(0, statusMatch.index) : output;
        
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
            headers: {},
            url,
            redirected: false,
            content: content || ''
        };
        
    } catch (error) {
        console.error('HTTP request error:', error.message);
        return {
            ok: false,
            status: 500,
            statusText: error.message,
            url,
            content: ''
        };
    }
}

// 异步请求接口
export function http(url, options = {}) {
    if (options?.async === false) {
        return httpClient.request(url, options);
    }
    
    return new Promise((resolve) => {
        httpClient.request(url, options)
            .then(res => {
                if (options.complete) {
                    options.complete(res);
                }
                resolve(res);
            })
            .catch(err => {
                console.error(err.name, err.message, err.stack);
                const errorRes = {
                    ok: false,
                    status: 500,
                    url
                };
                if (options.complete) {
                    options.complete(errorRes);
                }
                resolve(errorRes);
            });
    });
}

// 导出_http作为别名
export const _http = http;

// 默认导出
export default http;