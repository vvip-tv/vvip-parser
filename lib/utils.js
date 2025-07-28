import { URL, URLSearchParams } from 'url';

// URL拼接工具
export function joinUrl(base, url) {
    if (!url) return base;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    try {
        const baseUrl = new URL(base);
        return new URL(url, baseUrl).toString();
    } catch (error) {
        // 如果URL解析失败，尝试简单拼接
        if (base.endsWith('/') && url.startsWith('/')) {
            return base + url.substring(1);
        } else if (!base.endsWith('/') && !url.startsWith('/')) {
            return base + '/' + url;
        }
        return base + url;
    }
}

// 简繁体转换（这里只是占位实现，实际需要完整的转换表）
const s2tMap = {
    '国': '國',
    '爱': '愛',
    '学': '學',
    '习': '習',
    '书': '書',
    '电': '電',
    '脑': '腦',
    // ... 更多映射
};

const t2sMap = Object.fromEntries(
    Object.entries(s2tMap).map(([k, v]) => [v, k])
);

export function s2t(text) {
    let result = text;
    for (const [s, t] of Object.entries(s2tMap)) {
        result = result.replace(new RegExp(s, 'g'), t);
    }
    return result;
}

export function t2s(text) {
    let result = text;
    for (const [t, s] of Object.entries(t2sMap)) {
        result = result.replace(new RegExp(t, 'g'), s);
    }
    return result;
}

// 获取代理地址（根据配置）
export function getProxy(local = false) {
    // 这里返回默认的代理地址，实际使用时可根据配置调整
    if (local) {
        return 'http://127.0.0.1:8080';
    }
    return '';
}

// 解析查询字符串
export function parseQueryString(query) {
    const params = new URLSearchParams(query);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

// 构建查询字符串
export function buildQueryString(params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && value !== undefined) {
            searchParams.append(key, value);
        }
    }
    return searchParams.toString();
}

// 延时函数
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 定时器实现
export function setTimeout(callback, delay) {
    return global.setTimeout(callback, delay);
}

export function clearTimeout(id) {
    return global.clearTimeout(id);
}

// 相似度计算（简单实现）
export function similarity(s1, s2) {
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = (s1, s2) => {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    };
    
    return (longer.length - editDistance(longer, shorter)) / parseFloat(longer.length);
}

export default {
    joinUrl,
    s2t,
    t2s,
    getProxy,
    parseQueryString,
    buildQueryString,
    sleep,
    setTimeout,
    clearTimeout,
    similarity
};