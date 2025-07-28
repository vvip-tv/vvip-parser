# vvip-parser

基于 Node.js 的视频解析爬虫框架，从 QuickJS Android 版本重构而来。

## 特性

- 支持 drpy2.js 框架和规则文件
- 使用 VM SourceTextModule 实现 ES6 模块加载
- 兼容原 QuickJS 爬虫的 API
- 零依赖本地化实现（所有依赖已下载到本地）
- 提供完整的 CLI 工具，支持自动退出
- 内置 HTTP 请求、加密、本地存储等功能

## 安装

```bash
npm install
```

## 使用方法

### CLI 命令

```bash
# 注意：所有命令需要添加 --experimental-vm-modules 参数

# 运行 drpy2.js 框架和规则文件
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/cg.js -m home

# 初始化爬虫
node --experimental-vm-modules cli.js init ./spider.js -e '{"key": "value"}'

# 获取首页内容
node --experimental-vm-modules cli.js home

# 获取分类内容
node --experimental-vm-modules cli.js category 1 1

# 获取详情
node --experimental-vm-modules cli.js detail video_id

# 搜索
node --experimental-vm-modules cli.js search "关键词" 1

# 获取播放地址
node --experimental-vm-modules cli.js play "HD高清" "https://example.com/video.m3u8"

# 运行脚本并执行方法
node --experimental-vm-modules cli.js run ./spider.js -m home

# 测试爬虫所有功能
node --experimental-vm-modules cli.js test ./spider.js
```

### 编程接口

```javascript
import { loadSpider } from './lib/spider.js';

// 加载爬虫
const spider = await loadSpider('./spider.js');

// 初始化
await spider.init('');

// 获取首页
const homeData = await spider.home(true);

// 获取分类
const categoryData = await spider.category('1', '1', true, {});

// 获取详情
const detailData = await spider.detail('video_id');

// 搜索
const searchData = await spider.search('关键词', false, '1');

// 播放
const playData = await spider.play('HD高清', 'video_url', []);

// 销毁
await spider.destroy();
```

## drpy2.js 框架支持

### 框架特性

- 支持完整的 drpy2.js 视频解析框架
- 兼容菜狗等站点规则文件
- 本地化所有依赖（cheerio、crypto-js、jsencrypt 等）
- 使用 ES6 模块系统加载

### 快速开始

1. **运行示例规则**：
```bash
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/cg.js -m home
```

2. **测试分类功能**：
```bash
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/cg.js -m category -a '["teleplay", "1"]'
```

### 目录结构

```
tests/
├── drpy2.js          # drpy2 核心框架
├── cg.js             # 菜狗站点规则
├── cheerio.min.js    # HTML 解析库
├── crypto-js.js      # 加密库
├── jsencrypt.js      # RSA 加密
├── 模板.js           # drpy2 模板
└── gbk.js            # GBK 编码支持
```

### 规则文件格式

```javascript
var rule = {
    title: '站点名称',
    host: 'https://example.com',
    homeUrl: '',
    searchUrl: 'https://example.com/search?q=**',
    searchable: 2,
    quickSearch: 0,
    filterable: 1,
    
    // 分类定义
    class_name: '电视剧&电影&动漫',
    class_url: 'tv&movie&anime',
    
    // 解析规则
    一级: 'js:...', // 列表页解析
    二级: 'js:...', // 详情页解析
    搜索: 'js:...', // 搜索页解析
    
    // 过滤器配置
    filter: {
        // ... 筛选配置
    }
};
```

## 传统爬虫脚本格式

### ES Module 格式（推荐）

```javascript
export default {
    async init(ext) {
        // 初始化
    },
    
    async home(filter) {
        // 返回首页内容
        return JSON.stringify({
            class: [],
            filters: {}
        });
    },
    
    async category(tid, pg, filter, extend) {
        // 返回分类内容
        return JSON.stringify({
            page: 1,
            pagecount: 1,
            list: []
        });
    },
    
    // ... 其他方法
};
```

## API 兼容性

### 全局函数

- `req(url, options)` - HTTP 请求（同步风格）
- `http(url, options)` - HTTP 请求（异步）
- `_http(url, options)` - http 的别名
- `md5X(text)` - MD5 加密
- `aesX(mode, encrypt, input, key, iv)` - AES 加密/解密
- `rsaX(mode, encrypt, input, key)` - RSA 加密/解密
- `joinUrl(base, url)` - URL 拼接
- `s2t(text)` - 简体转繁体
- `t2s(text)` - 繁体转简体
- `getProxy(local)` - 获取代理地址
- `similarity(s1, s2)` - 字符串相似度计算

### 本地存储

- `local.get(rule, key)` - 获取缓存
- `local.set(rule, key, value)` - 设置缓存
- `local.delete(rule, key)` - 删除缓存

### 内置库

- `cheerio` - HTML 解析库（兼容 jQuery 语法）

## 测试

运行 drpy2.js 框架测试：

```bash
# 完整测试 drpy2 + 菜狗规则
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/cg.js -m home

# 运行传统测试（如果需要）
npm test
```

## 目录结构

```
vvip-parser/
├── lib/
│   ├── spider.js      # 爬虫核心模块（使用 VM SourceTextModule）
│   ├── http.js        # HTTP 请求模块
│   ├── crypto.js      # 加密模块
│   ├── utils.js       # 工具函数
│   └── local.js       # 本地存储
├── tests/
│   ├── drpy2.js       # drpy2 核心框架
│   ├── cg.js          # 菜狗站点规则示例
│   ├── cheerio.min.js # HTML 解析库（本地化）
│   ├── crypto-js.js   # 加密库（本地化）
│   ├── jsencrypt.js   # RSA 加密（本地化）
│   ├── 模板.js        # drpy2 模板（本地化）
│   └── gbk.js         # GBK 编码支持（本地化）
├── quickjs/           # QuickJS Android 源码参考
├── cli.js             # CLI 入口
├── package.json       # 项目配置
└── README.md          # 说明文档
```

## 技术实现

### VM SourceTextModule
- 使用 Node.js 的 `vm.SourceTextModule` 实现 ES6 模块加载
- 支持动态模块链接和相对路径导入
- 创建沙箱环境隔离执行上下文

### 零依赖设计
- 所有外部依赖已下载到 `tests/` 目录
- cheerio、crypto-js、jsencrypt 等库本地化
- 避免网络请求，提高加载速度和稳定性

### 进程管理
- CLI 命令执行完成后自动退出
- 正确清理 VM 上下文和资源
- 支持错误处理和异常退出

## 注意事项

1. 需要使用 `--experimental-vm-modules` 参数启动 Node.js
2. 爬虫脚本中的所有方法都应该返回字符串格式的 JSON
3. 本地缓存存储在 `.cache` 目录中
4. drpy2.js 框架依赖已本地化，无需网络连接

## 示例和测试

### drpy2.js 框架示例

项目内置了完整的 drpy2.js 框架和菜狗站点规则：

```bash
# 获取首页分类
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/cg.js -m home

# 获取电视剧分类第一页
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/cg.js -m category -a '["teleplay", "1"]'

# 搜索功能
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/cg.js -m search -a '["测试"]'
```

### 从 QuickJS 迁移

成功将以下功能从 QuickJS 迁移到 Node.js：

1. **模块加载系统**：从 QuickJS 的字节码模块转换为 Node.js 的 SourceTextModule
2. **依赖管理**：将 HTTP 依赖本地化到 `tests/` 目录
3. **API 兼容性**：保持与原 QuickJS 版本的接口一致
4. **执行环境**：创建沙箱环境模拟 QuickJS 的执行上下文

## 复杂爬虫（多文件依赖）

对于需要多个文件和模块的复杂爬虫，使用增强的模块加载器：

### 目录结构示例

```
complex-spider/
├── main.js          # 主入口文件
├── config.js        # 配置文件
├── fetcher.js       # HTTP请求封装
├── parser.js        # HTML解析器
└── utils/           # 工具函数目录
    ├── index.js     # 导出所有工具
    ├── url.js       # URL处理
    ├── builder.js   # URL构建
    └── formatter.js # 数据格式化
```

### 主文件示例

```javascript
// main.js
import { Parser } from './parser.js';
import { Fetcher } from './fetcher.js';
import { config } from './config.js';
import * as utils from './utils/index.js';

export default {
    async init(ext) {
        this.fetcher = new Fetcher(config);
        this.parser = new Parser();
    },
    
    async home(filter) {
        const html = await this.fetcher.get(config.homeUrl);
        const classes = this.parser.parseClasses(html);
        return JSON.stringify({ class: classes });
    }
    // ... 其他方法
};
```

### 使用CLI加载

```bash
# 自动检测import语句，使用增强加载器
node cli.js run examples/complex/main.js -m home

# 或显式指定使用增强加载器
node cli.js run examples/complex/main.js --enhanced -m home
```

## 多文件合并加载（类似HTML的script标签）

当需要将多个JS文件加载到同一环境中（就像HTML中的多个`<script>`标签），可以使用合并加载功能：

### 使用场景

- 将代码拆分成多个模块文件
- 共享全局函数和变量
- 按顺序依赖加载

### 示例

```bash
# 加载多个文件到同一环境
node cli.js init utils.js parser.js spider.js

# 运行测试
node cli.js run utils.js parser.js spider.js -m home
```

### 文件示例

**utils.js** - 基础工具函数
```javascript
// 定义全局函数
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

// 定义全局配置
const CONFIG = {
    timeout: 10000
};

// 导出到全局
globalThis.formatDate = formatDate;
globalThis.CONFIG = CONFIG;
```

**parser.js** - 解析器（使用utils.js的函数）
```javascript
// 使用前面文件定义的函数
function parseVideo(html) {
    const date = formatDate(new Date()); // 使用utils.js的函数
    // ... 解析逻辑
}

globalThis.parseVideo = parseVideo;
```

**spider.js** - 主爬虫（使用前面所有文件）
```javascript
// 使用前面文件的所有功能
const spider = {
    async home(filter) {
        const data = parseVideo(html); // 使用parser.js的函数
        console.log('超时设置:', CONFIG.timeout); // 使用utils.js的配置
        // ...
    }
};

globalThis.__JS_SPIDER__ = spider;
```

加载顺序很重要，后面的文件可以使用前面文件定义的内容。

## 创建自定义爬虫

### 基本结构

```javascript
export default {
    // 必须实现的方法
    async init(ext) {
        // 初始化，ext是扩展配置
    },
    
    async home(filter) {
        // 返回首页分类和筛选
        return JSON.stringify({
            class: [
                { type_id: '1', type_name: '电影' }
            ],
            filters: {}
        });
    },
    
    async category(tid, pg, filter, extend) {
        // 返回分类列表
        return JSON.stringify({
            page: 1,
            pagecount: 1,
            list: []
        });
    },
    
    async detail(id) {
        // 返回详情
        return JSON.stringify({
            list: [{
                vod_id: id,
                vod_name: '影片名',
                vod_play_from: '播放源',
                vod_play_url: '第1集$url1#第2集$url2'
            }]
        });
    },
    
    async search(wd, quick, pg) {
        // 返回搜索结果
        return JSON.stringify({
            list: []
        });
    },
    
    async play(flag, id, vipFlags) {
        // 返回播放地址
        return JSON.stringify({
            parse: 0,
            url: id
        });
    }
};
```

### 使用HTTP请求

```javascript
import { http } from '../lib/http.js';

// GET请求
const response = await http('https://example.com');
if (response.ok) {
    console.log(response.content);
}

// POST请求
const response = await http('https://example.com/api', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    data: JSON.stringify({ key: 'value' }),
    postType: 'json'
});
```

### 使用Cheerio解析HTML

```javascript
import * as cheerio from 'cheerio';

const $ = cheerio.load(html);
$('.item').each((index, element) => {
    const title = $(element).find('.title').text();
    const link = $(element).find('a').attr('href');
});
```

### 使用加密功能

```javascript
import { md5X, aesX, rsaX } from '../lib/crypto.js';

// MD5
const hash = md5X('text');

// AES加密
const encrypted = aesX('ECB/Pkcs7', true, 'plaintext', 'key16bytes');

// AES解密
const decrypted = aesX('ECB/Pkcs7', false, encrypted, 'key16bytes');
```

### 使用本地存储

```javascript
import { local } from '../lib/local.js';

// 存储
await local.set('spider_name', 'config_key', { data: 'value' });

// 读取
const data = await local.get('spider_name', 'config_key');

// 删除
await local.delete('spider_name', 'config_key');
```

## 调试技巧

1. 使用 `console.log` 输出调试信息
2. 使用 `node cli.js run` 命令快速测试单个方法
3. 使用 `node cli.js test` 命令完整测试所有功能
4. 检查 `.cache` 目录查看缓存的内容

## 性能优化

1. 合理使用本地缓存减少网络请求
2. 使用并发请求提高效率（注意控制并发数）
3. 对于大量数据使用流式处理
4. 避免在循环中进行同步操作

## 常见问题

### Q: 如何处理需要登录的网站？
A: 可以在请求头中添加Cookie或使用session管理。

### Q: 如何处理验证码？
A: 需要接入验证码识别服务或手动处理。

### Q: 如何处理动态加载的内容？
A: 可以分析API接口直接请求数据，或使用Puppeteer等工具。

### Q: 如何提高爬虫稳定性？
A: 添加重试机制、错误处理、请求限流等。

## 许可证

ISC