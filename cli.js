#!/usr/bin/env node

import { Command } from 'commander';
import { loadSpider } from './lib/spider.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
    .name('vvip-parser')
    .description('Node.js based video parser with spider framework')
    .version('1.0.0');

// 初始化命令
program
    .command('init <script>')
    .description('初始化爬虫脚本')
    .option('-e, --extend <extend>', '扩展配置或规则文件路径')
    .option('-u, --url', '从URL加载脚本')
    .action(async (script, options) => {
        try {
            console.log(`正在初始化爬虫...`);
            
            let extend = options.extend || '';
            
            // 如果extend是文件路径，读取文件内容
            if (extend && (extend.endsWith('.js') || extend.includes('/'))) {
                try {
                    const extendContent = await fs.readFile(extend, 'utf8');
                    extend = extendContent;
                    console.log(`已读取扩展配置: ${extend}`);
                } catch (err) {
                    console.warn(`无法读取扩展配置文件 ${extend}: ${err.message}`);
                }
            }
            
            // 加载爬虫 (统一使用ES6模块加载)
            const spider = await loadSpider(script, options.url);
            
            // 如果有扩展配置且是代码，需要在上下文中执行
            if (extend && extend.includes('var rule')) {
                const vm = await import('vm');
                const ruleScript = new vm.Script(extend, { filename: 'extend.js' });
                ruleScript.runInContext(spider.context);
                console.log(`已在爬虫上下文中加载规则配置`);
            }
            
            await spider.init(extend);
            
            console.log('爬虫初始化成功！');
            
            // 保存spider实例供后续使用
            global.currentSpider = spider;
            process.exit(0);
        } catch (error) {
            console.error('初始化失败:', error.message);
            process.exit(1);
        }
    });

// 获取首页内容
program
    .command('home')
    .description('获取首页内容')
    .option('-f, --filter', '包含过滤器', true)
    .action(async (options) => {
        try {
            if (!global.currentSpider) {
                console.error('请先使用 init 命令初始化爬虫');
                process.exit(1);
            }
            
            const result = await global.currentSpider.home(options.filter);
            console.log(result);
            process.exit(0);
        } catch (error) {
            console.error('获取首页内容失败:', error.message);
            process.exit(1);
        }
    });

// 获取分类内容
program
    .command('category <tid> [page]')
    .description('获取分类内容')
    .option('-f, --filter', '包含过滤器', true)
    .option('-e, --extend <extend>', '扩展参数 (JSON格式)')
    .action(async (tid, page = '1', options) => {
        try {
            if (!global.currentSpider) {
                console.error('请先使用 init 命令初始化爬虫');
                process.exit(1);
            }
            
            const extend = options.extend ? JSON.parse(options.extend) : {};
            const result = await global.currentSpider.category(tid, page, options.filter, extend);
            console.log(result);
            process.exit(0);
        } catch (error) {
            console.error('获取分类内容失败:', error.message);
            process.exit(1);
        }
    });

// 获取详情
program
    .command('detail <id>')
    .description('获取视频详情')
    .action(async (id) => {
        try {
            if (!global.currentSpider) {
                console.error('请先使用 init 命令初始化爬虫');
                process.exit(1);
            }
            
            const result = await global.currentSpider.detail(id);
            console.log(result);
            process.exit(0);
        } catch (error) {
            console.error('获取详情失败:', error.message);
            process.exit(1);
        }
    });

// 搜索
program
    .command('search <keyword> [page]')
    .description('搜索视频')
    .option('-q, --quick', '快速搜索', false)
    .action(async (keyword, page = '1', options) => {
        try {
            if (!global.currentSpider) {
                console.error('请先使用 init 命令初始化爬虫');
                process.exit(1);
            }
            
            const result = await global.currentSpider.search(keyword, options.quick, page);
            console.log(result);
            process.exit(0);
        } catch (error) {
            console.error('搜索失败:', error.message);
            process.exit(1);
        }
    });

// 播放
program
    .command('play <flag> <id>')
    .description('获取播放地址')
    .option('-v, --vip-flags <flags>', 'VIP标志列表 (逗号分隔)')
    .action(async (flag, id, options) => {
        try {
            if (!global.currentSpider) {
                console.error('请先使用 init 命令初始化爬虫');
                process.exit(1);
            }
            
            const vipFlags = options.vipFlags ? options.vipFlags.split(',') : [];
            const result = await global.currentSpider.play(flag, id, vipFlags);
            console.log(result);
            process.exit(0);
        } catch (error) {
            console.error('获取播放地址失败:', error.message);
            process.exit(1);
        }
    });

// 运行脚本
program
    .command('run <script>')
    .description('运行爬虫脚本并执行指定方法')
    .option('-u, --url', '从URL加载脚本')
    .option('-m, --method <method>', '要执行的方法', 'home')
    .option('-a, --args <args>', '方法参数 (JSON格式)')
    .option('-e, --extend <extend>', '初始化扩展配置或规则文件路径')
    .option('-q, --quiet', '静默模式，只输出JSON结果')
    .action(async (script, options) => {
        try {
            let extend = options.extend || '';
            
            // 如果extend是文件路径，读取文件内容
            if (extend && (extend.endsWith('.js') || extend.includes('/'))) {
                try {
                    extend = await fs.readFile(extend, 'utf8');
                } catch (err) {
                    if (!options.quiet) {
                        console.warn(`无法读取扩展配置文件: ${err.message}`);
                    }
                }
            }
            
            // 劫持console方法以控制输出
            const originalConsole = { ...console };
            if (options.quiet) {
                console.log = () => {};
                console.warn = () => {};
                console.info = () => {};
            }
            
            // 加载爬虫 (统一使用ES6模块加载)
            const spider = await loadSpider(script, options.url);
            
            // 如果有规则配置，在上下文中执行
            if (extend && extend.includes('var rule')) {
                const vm = await import('vm');
                const ruleScript = new vm.Script(extend, { filename: 'extend.js' });
                ruleScript.runInContext(spider.context);
            }
            
            // 初始化
            await spider.init(extend);
            
            // 解析参数
            const args = options.args ? JSON.parse(options.args) : [];
            
            // 执行方法
            let result;
            switch (options.method) {
                case 'home':
                    result = await spider.home(...args);
                    break;
                case 'homeVod':
                    result = await spider.homeVod(...args);
                    break;
                case 'category':
                    result = await spider.category(...args);
                    break;
                case 'detail':
                    result = await spider.detail(...args);
                    break;
                case 'search':
                    result = await spider.search(...args);
                    break;
                case 'play':
                    result = await spider.play(...args);
                    break;
                default:
                    throw new Error(`未知方法: ${options.method}`);
            }
            
            // 恢复console并输出结果
            if (options.quiet) {
                Object.assign(console, originalConsole);
                console.log(JSON.stringify(result));
            } else {
                console.log(result);
            }
            
            // 销毁爬虫
            await spider.destroy();
            process.exit(0);
        } catch (error) {
            // 恢复console以显示错误
            if (options.quiet && typeof originalConsole !== 'undefined') {
                Object.assign(console, originalConsole);
            }
            console.error('执行失败:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
    });

// 测试命令
program
    .command('test <script>')
    .description('测试爬虫脚本的所有基本功能')
    .option('-u, --url', '从URL加载脚本')
    .option('-e, --extend <extend>', '初始化扩展配置或规则文件路径')
    .action(async (script, options) => {
        try {
            console.log('开始测试爬虫脚本...\n');
            
            let extend = options.extend || '';
            
            // 如果extend是文件路径，读取文件内容
            if (extend && (extend.endsWith('.js') || extend.includes('/'))) {
                try {
                    extend = await fs.readFile(extend, 'utf8');
                } catch (err) {
                    console.warn(`无法读取扩展配置文件: ${err.message}`);
                }
            }
            
            // 加载爬虫 (统一使用ES6模块加载)
            const spider = await loadSpider(script, options.url);
            
            // 如果有规则配置，在上下文中执行
            if (extend && extend.includes('var rule')) {
                const vm = await import('vm');
                const ruleScript = new vm.Script(extend, { filename: 'extend.js' });
                ruleScript.runInContext(spider.context);
            }
            
            // 初始化
            console.log('1. 测试初始化...');
            await spider.init(extend);
            console.log('✓ 初始化成功\n');
            
            // 测试首页
            console.log('2. 测试获取首页...');
            const homeResult = await spider.home(true);
            const homeData = JSON.parse(homeResult);
            console.log(`✓ 获取到 ${homeData.class?.length || 0} 个分类\n`);
            
            // 测试首页推荐
            console.log('3. 测试获取首页推荐...');
            const homeVodResult = await spider.homeVod();
            const homeVodData = JSON.parse(homeVodResult);
            console.log(`✓ 获取到 ${homeVodData.list?.length || 0} 个推荐视频\n`);
            
            // 如果有分类，测试分类内容
            if (homeData.class && homeData.class.length > 0) {
                const firstCategory = homeData.class[0];
                console.log(`4. 测试获取分类内容 (${firstCategory.type_name})...`);
                const categoryResult = await spider.category(firstCategory.type_id, '1', true, {});
                const categoryData = JSON.parse(categoryResult);
                console.log(`✓ 获取到 ${categoryData.list?.length || 0} 个视频\n`);
                
                // 如果有视频，测试详情
                if (categoryData.list && categoryData.list.length > 0) {
                    const firstVideo = categoryData.list[0];
                    console.log(`5. 测试获取视频详情 (${firstVideo.vod_name})...`);
                    const detailResult = await spider.detail(firstVideo.vod_id);
                    const detailData = JSON.parse(detailResult);
                    console.log(`✓ 获取详情成功\n`);
                    
                    // 如果有播放信息，测试播放
                    if (detailData.list && detailData.list.length > 0 && detailData.list[0].vod_play_url) {
                        const playInfo = detailData.list[0].vod_play_url.split('$$$')[0];
                        const firstEpisode = playInfo.split('#')[0];
                        const [name, url] = firstEpisode.split('$');
                        
                        console.log(`6. 测试获取播放地址 (${name})...`);
                        const playResult = await spider.play(detailData.list[0].vod_play_from.split('$$$')[0], url, []);
                        const playData = JSON.parse(playResult);
                        console.log(`✓ 获取播放地址成功: ${playData.url || '解析地址'}\n`);
                    }
                }
            }
            
            // 测试搜索
            console.log('7. 测试搜索功能...');
            const searchResult = await spider.search('测试', false, '1');
            const searchData = JSON.parse(searchResult);
            console.log(`✓ 搜索到 ${searchData.list?.length || 0} 个结果\n`);
            
            // 销毁爬虫
            await spider.destroy();
            
            console.log('测试完成！所有功能正常。');
            process.exit(0);
        } catch (error) {
            console.error('\n测试失败:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
    });

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
    program.outputHelp();
}