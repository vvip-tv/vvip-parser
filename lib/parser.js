import { joinUrl } from './utils.js';
import * as cheerio from 'cheerio';

// HTML解析器类
class Parser {
    constructor() {
        this.cache = new Map();
        this.urlPattern = /url\((.*?)\)/gi;
        this.noAddPattern = /:eq|:lt|:gt|:first|:last|:not|:even|:odd|:has|:contains|:matches|:empty|^body$/i;
        this.joinUrlPattern = /(url|src|href|-original|-src|-play|-url|style)$|^(data-|url-|src-)/i;
        this.specUrlPattern = /^(ftp|magnet|thunder|ws):/i;
    }

    // 获取解析信息
    getParseInfo(rule) {
        const info = { rule, index: 0, excludes: null };
        
        if (rule.includes(':eq')) {
            const parts = rule.split(':');
            info.rule = parts[0];
            const eqPart = parts[1];
            if (eqPart.startsWith('eq(') && eqPart.endsWith(')')) {
                info.index = parseInt(eqPart.slice(3, -1)) || 0;
            }
        } else if (rule.includes('--')) {
            const rules = rule.split('--');
            info.excludes = rules.slice(1);
            info.rule = rules[0];
        }
        
        return info;
    }

    // 转换Hiker规则为jQuery规则
    parseHikerToJq(parse, first) {
        if (!parse.includes('&&')) {
            const split = parse.split(' ');
            const lastPart = split[split.length - 1];
            if (!this.noAddPattern.test(lastPart) && first) {
                parse = parse + ':eq(0)';
            }
            return parse;
        }

        const parses = parse.split('&&');
        const items = [];
        
        for (let i = 0; i < parses.length; i++) {
            const split = parses[i].split(' ');
            const lastPart = split[split.length - 1];
            
            if (this.noAddPattern.test(lastPart)) {
                items.push(parses[i]);
            } else {
                if (!first && i >= parses.length - 1) {
                    items.push(parses[i]);
                } else {
                    items.push(parses[i] + ':eq(0)');
                }
            }
        }
        
        return items.join(' ');
    }

    // 解析单个规则
    parseOneRule($, parse, elements) {
        const info = this.getParseInfo(parse);
        let result;
        
        if (!elements || elements.length === 0) {
            result = $(info.rule);
        } else {
            result = elements.find(info.rule);
        }

        // 处理:eq选择器
        if (parse.includes(':eq')) {
            if (info.index < 0) {
                result = result.eq(result.length + info.index);
            } else {
                result = result.eq(info.index);
            }
        }

        // 处理排除规则
        if (info.excludes && result.length > 0) {
            info.excludes.forEach(exclude => {
                result.find(exclude).remove();
            });
        }

        return result;
    }

    // 解析DOM获取URL
    parseDomForUrl(html, rule, addUrl = '') {
        try {
            const $ = cheerio.load(html);

            // 处理特殊规则
            if (rule === 'body&&Text' || rule === 'Text') {
                return $('body').text() || $.text();
            } else if (rule === 'body&&Html' || rule === 'Html') {
                return $('body').html() || $.html();
            }

            let option = '';
            if (rule.includes('&&')) {
                const rs = rule.split('&&');
                option = rs[rs.length - 1];
                rule = rs.slice(0, -1).join('&&');
            }

            rule = this.parseHikerToJq(rule, true);
            const parses = rule.split(' ');
            let elements = null;

            for (const parse of parses) {
                elements = this.parseOneRule($, parse, elements);
                if (!elements || elements.length === 0) return '';
            }

            // 返回结果
            if (!option) return elements.toString();

            if (option === 'Text') {
                return elements.text();
            } else if (option === 'Html') {
                return elements.html();
            } else {
                // 处理属性
                const attrs = option.split('||');
                for (const attr of attrs) {
                    let result = elements.attr(attr);
                    
                    if (attr.toLowerCase().includes('style') && result && result.includes('url(')) {
                        const match = result.match(this.urlPattern);
                        if (match) {
                            result = match[1];
                            result = result.replace(/^['"](.*)['"]$/, '$1');
                        }
                    }

                    if (result && addUrl) {
                        if (this.joinUrlPattern.test(attr) && !this.specUrlPattern.test(result)) {
                            if (result.includes('http')) {
                                result = result.substring(result.indexOf('http'));
                            } else {
                                result = joinUrl(addUrl, result);
                            }
                        }
                    }

                    if (result) return result;
                }
                return '';
            }
        } catch (error) {
            console.error('Parse error:', error);
            return '';
        }
    }

    // 解析DOM获取数组
    parseDomForArray(html, rule) {
        try {
            const $ = cheerio.load(html);
            rule = this.parseHikerToJq(rule, false);
            const parses = rule.split(' ');
            let elements = null;

            for (const parse of parses) {
                elements = this.parseOneRule($, parse, elements);
                if (!elements || elements.length === 0) return [];
            }

            const items = [];
            elements.each((i, el) => {
                items.push($(el).toString());
            });
            
            return items;
        } catch (error) {
            console.error('Parse error:', error);
            return [];
        }
    }

    // 解析DOM获取列表
    parseDomForList(html, rule, texts, urls, urlKey) {
        try {
            const $ = cheerio.load(html);
            const parses = this.parseHikerToJq(rule, false).split(' ');
            let elements = null;

            for (const parse of parses) {
                elements = this.parseOneRule($, parse, elements);
                if (!elements || elements.length === 0) return [];
            }

            const items = [];
            elements.each((i, el) => {
                const elementHtml = $(el).toString();
                const text = this.parseDomForUrl(elementHtml, texts, '').trim();
                const url = this.parseDomForUrl(elementHtml, urls, urlKey);
                items.push(text + '$' + url);
            });

            return items;
        } catch (error) {
            console.error('Parse error:', error);
            return [];
        }
    }
}

// 创建全局解析器实例
const parser = new Parser();

// 导出全局方法
export function pd(html, rule, urlKey = '') {
    return parser.parseDomForUrl(html, rule, urlKey);
}

export function pdfh(html, rule) {
    return parser.parseDomForUrl(html, rule, '');
}

export function pdfa(html, rule) {
    return parser.parseDomForArray(html, rule);
}

export function pdfl(html, rule, texts, urls, urlKey = '') {
    return parser.parseDomForList(html, rule, texts, urls, urlKey);
}

export default {
    pd,
    pdfh,
    pdfa,
    pdfl
};