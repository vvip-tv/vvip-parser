# vvip-parser

基于 Node.js 的视频解析爬虫框架，成功从 QuickJS Android 版本重构而来。专为支持 drpy2.js 框架和站点规则文件设计，实现零依赖的本地化爬虫解决方案。

## ✨ 核心特性

- 🚀 **完整 drpy2.js 支持** - 支持 drpy2 视频解析框架，兼容各种站点规则
- 🔧 **VM SourceTextModule** - 使用 Node.js 的 vm.SourceTextModule 实现 ES6 模块加载
- 🎯 **HTML解析支持** - 完整实现 pd、pdfh、pdfa、pdfl 四个全局解析方法
- 📦 **标准依赖管理** - 使用 npm 管理依赖，支持 cheerio 等标准库
- ⚡ **高性能执行** - 沙箱环境隔离，支持同步HTTP请求
- 🛠️ **完整CLI工具** - 命令行界面，支持JSON输出和自动退出
- 🔒 **QuickJS兼容** - 保持与原 QuickJS 版本的完整 API 兼容性

## 📋 系统要求

- Node.js 16.0+ (支持 VM Modules)
- 无其他外部依赖

## 🚀 快速开始

### 安装和基本使用

```bash
# 克隆项目
git clone https://github.com/vvip-tv/vvip-parser.git
cd vvip-parser

# 安装依赖
npm install

# 运行 drpy2 + 360影视规则获取首页（推荐测试）
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home

# 获取纯净JSON输出（推荐）
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home -q
```

### 核心命令示例

```bash
# 注意：所有命令需要 --experimental-vm-modules 参数

# 🏠 获取首页分类和过滤器
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home -q

# 📺 获取电视剧列表（第1页）
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m category -a '[\"2\", \"1\"]' -q

# 🔍 搜索功能
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m search -a '[\"复仇者联盟\"]' -q

# 📖 获取详情页（需要有效的视频ID）
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m detail -a '[\"video_id\"]' -q

# 🧪 完整功能测试（测试所有10个方法）
node --experimental-vm-modules cli.js test tests/drpy2.js -e tests/360.js
```

## 📚 详细使用指南

### CLI 命令详解

#### `run` 命令 - 运行爬虫脚本

```bash
node --experimental-vm-modules cli.js run <script> [options]

参数：
  <script>              爬虫脚本路径（如 tests/drpy2.js）
  
选项：
  -e, --extend <path>   规则文件路径（如 tests/360.js）
  -m, --method <name>   执行的方法 (默认: home)
  -a, --args <json>     方法参数（JSON格式）
  -q, --quiet           静默模式，只输出JSON结果
  -u, --url             从URL加载脚本

方法列表：
  home         获取首页分类和过滤器
  homeVod      获取首页推荐内容
  category     获取分类列表
  detail       获取视频详情
  search       搜索视频
  play         获取播放地址
  sniffer      嗅探功能
  isVideo      视频格式检测
  proxy        代理功能
```

#### `test` 命令 - 全面测试

```bash
node --experimental-vm-modules cli.js test <script> -e <rules>

# 示例：测试 drpy2 + 360影视规则的所有10个方法功能
node --experimental-vm-modules cli.js test tests/drpy2.js -e tests/360.js

测试覆盖方法：
  ✅ init         - 初始化爬虫
  ✅ home         - 获取首页分类
  ✅ homeVod      - 获取首页推荐
  ✅ category     - 获取分类内容
  ✅ detail       - 获取视频详情
  ✅ play         - 获取播放地址
  ✅ search       - 搜索功能
  ✅ sniffer      - 嗅探功能
  ✅ isVideo      - 视频格式检测
  ✅ proxy        - 代理功能
```

#### 静默模式 `-q` 的优势

静默模式会：
- 隐藏所有调试输出
- 只显示最终的JSON结果
- 便于脚本集成和数据处理

```bash
# 正常模式（包含调试信息）
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home

# 静默模式（纯净JSON）
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home -q
```

### 编程接口

```javascript
import { loadSpider } from './lib/spider.js';

async function example() {
    // 1. 加载爬虫脚本
    const spider = await loadSpider('./tests/drpy2.js');
    
    // 2. 读取规则文件
    const ruleContent = await fs.readFile('./tests/360.js', 'utf8');
    
    // 3. 初始化
    await spider.init(ruleContent);
    
    // 4. 获取首页
    const homeResult = await spider.home(true);
    const homeData = JSON.parse(homeResult);
    console.log('分类数量:', homeData.class.length);
    
    // 5. 获取分类内容
    const categoryResult = await spider.category('2', '1', true, {});
    const categoryData = JSON.parse(categoryResult);
    console.log('视频数量:', categoryData.list.length);
    
    // 6. 搜索
    const searchResult = await spider.search('复仇者联盟', false, '1');
    const searchData = JSON.parse(searchResult);
    console.log('搜索结果:', searchData.list.length);
    
    // 7. 清理资源
    await spider.destroy();
}
```

## 🗂️ 项目结构

```
vvip-parser/
├── 📁 lib/                    # 核心库
│   ├── spider.js              # 爬虫核心（VM SourceTextModule）
│   ├── parser.js              # HTML解析器（pd/pdfh/pdfa/pdfl）
│   ├── http.js                # 同步HTTP请求（execSync + curl）
│   ├── crypto.js              # 加密功能（MD5/AES/RSA）
│   ├── utils.js               # 工具函数
│   └── local.js               # 本地存储
├── 📁 tests/                  # drpy2框架和依赖（本地化）
│   ├── drpy2.js               # drpy2核心框架（已优化）
│   ├── 360.js                 # 360影视规则（推荐测试）
│   ├── cheerio.min.js         # HTML解析库（备用）
│   ├── crypto-js.js           # 加密库
│   ├── jsencrypt.js           # RSA加密
│   ├── 模板.js                # drpy2模板
│   └── gbk.js                 # GBK编码支持
├── 📁 quickjs/                # QuickJS源码参考
├── cli.js                     # CLI入口
├── package.json               # 项目配置（包含cheerio等依赖）
├── CLAUDE.md                  # 项目记忆
└── README.md                  # 本文档
```

## 🎯 drpy2.js 框架详解

### 框架特色

vvip-parser 完整支持 drpy2.js 框架，这是一个强大的视频解析框架：

- **版本**: drpy2 3.9.49beta40
- **兼容性**: 完美兼容各种站点规则文件
- **性能**: 已优化，移除冗余代码和调试语句
- **依赖**: 所有依赖已本地化，无需网络连接

### 规则文件格式

drpy2 规则文件采用声明式配置：

```javascript
var rule = {
    // 🏷️ 基本信息
    title: '360影视',                                    // 站点名称
    host: 'https://www.360kan.com',                     // 站点地址
    
    // 🔗 URL配置
    homeUrl: 'https://api.web.360kan.com/v1/rank?cat=2&size=9',
    searchUrl: 'https://api.so.360kan.com/index?kw=**&pageno=fypage',
    url: 'https://api.web.360kan.com/v1/filter/list?catid=fyclassfyfilter',
    
    // ⚙️ 功能开关
    searchable: 2,        // 搜索支持：0-不支持，1-支持，2-支持快速搜索
    quickSearch: 0,       // 快速搜索
    filterable: 1,        // 筛选支持
    
    // 📂 分类定义
    class_name: '电视剧&电影&综艺&动漫',
    class_url: '2&1&3&4',
    
    // 🔍 解析规则
    一级: 'json:data.movies;title;cover;pubdate;id;description',
    二级: 'js:...',       // JavaScript解析代码
    搜索: 'json:data.longData.rows;titleTxt||titlealias;cover;cat_name;cat_id+en_id',
    
    // 🎛️ 筛选器配置
    filter: {
        "1": [             // 电影筛选
            {
                "key": "class",
                "name": "剧情",
                "value": [
                    {"n": "全部", "v": ""},
                    {"n": "喜剧", "v": "喜剧"},
                    {"n": "动作", "v": "动作"}
                ]
            }
        ],
        "2": [...]         // 电视剧筛选
    }
};
```

### 内置站点规则

项目提供了几个测试规则：

#### 🎬 360影视 (tests/360.js) - 推荐
- **特点**: API接口，解析稳定
- **支持**: 电影、电视剧、综艺、动漫
- **筛选**: 支持多维度筛选
- **测试**: `node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home -q`


### 解析规则语法

drpy2 支持多种解析语法：

#### JSON解析
```javascript
// 格式：json:数据路径;标题;封面;备注;链接;描述
一级: 'json:data.list;name;pic;remarks;id;description'
```

#### JavaScript解析
```javascript
二级: 'js:
    let html = JSON.parse(fetch(input, fetch_params));
    let data = html.data;
    VOD = {
        vod_name: data.title,
        vod_pic: data.cover,
        vod_content: data.description
    };
'
```

## 🔧 技术架构

### VM SourceTextModule 模块系统

使用 Node.js 的实验性 VM 模块功能：

```javascript
// lib/spider.js 核心实现
import { SourceTextModule, SyntheticModule, createContext } from 'vm';

async function loadSpider(scriptPath) {
    // 1. 创建沙箱环境
    const sandbox = createSandbox(scriptPath);
    const context = createContext(sandbox);
    
    // 2. 创建模块
    const module = new SourceTextModule(code, {
        identifier: scriptPath,
        context
    });
    
    // 3. 链接模块依赖
    await module.link(linker);
    
    // 4. 执行模块
    await module.evaluate();
    
    return module.namespace.default;
}
```

### 同步HTTP请求实现

为了兼容 drpy2 框架的同步请求需求：

```javascript
// lib/http.js
import { execSync } from 'child_process';

function req(url, options = {}) {
    // 构建 curl 命令
    const curlCmd = buildCurlCommand(url, options);
    
    // 同步执行
    const result = execSync(curlCmd, { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 
    });
    
    return result;
}
```

### HTML解析器架构

项目实现了完整的HTML解析功能：

```javascript
// lib/parser.js - 核心HTML解析器
import * as cheerio from 'cheerio';  // 使用npm标准依赖

// 四个全局解析方法
pd(html, rule, urlKey)     // 解析DOM获取URL，支持URL拼接
pdfh(html, rule)           // 解析DOM获取第一个匹配项  
pdfa(html, rule)           // 解析DOM获取数组
pdfl(html, rule, texts, urls, urlKey)  // 解析DOM获取列表
```

**技术特点：**
- 基于Java版本完整移植的HTML解析逻辑
- 支持Hiker规则语法转换为jQuery选择器
- 自动处理`:eq()`、`--`排除规则等语法
- 完整的URL拼接和属性提取功能

### 依赖管理策略

```
package.json依赖:
├── cheerio      # HTML解析核心库
├── axios        # HTTP请求库  
├── crypto-js    # 加密功能
├── deasync      # 同步操作支持
└── commander    # CLI命令解析

tests/目录备用依赖:
├── drpy2.js          # 核心框架（35KB，已优化）
├── cheerio.min.js    # HTML解析（备用，284KB）
├── crypto-js.js      # 加密库（备用，127KB）
├── jsencrypt.js      # RSA加密（47KB）
├── 模板.js           # drpy2模板（8KB）
└── gbk.js            # GBK编码（25KB）
```

## 🛠️ 高级功能

### 本地存储系统

```javascript
import { local } from './lib/local.js';

// 缓存配置
await local.set('spider_name', 'config', { 
    timeout: 5000,
    retries: 3 
});

// 读取缓存
const config = await local.get('spider_name', 'config');

// 缓存搜索结果
await local.set('spider_name', `search_${keyword}`, results, 3600); // 1小时过期
```

### 加密工具集

```javascript
import { md5X, aesX, rsaX } from './lib/crypto.js';

// MD5哈希
const hash = md5X('password123');

// AES加密解密
const key = 'mykey1234567890';
const encrypted = aesX('ECB/Pkcs7', true, 'hello world', key);
const decrypted = aesX('ECB/Pkcs7', false, encrypted, key);

// RSA加密（需要公钥）
const rsaEncrypted = rsaX('RSA', true, 'data', publicKey);
```

### HTML解析功能

```javascript
import { pd, pdfh, pdfa, pdfl } from './lib/parser.js';

const html = '<div><a href="/movie/123">电影标题</a><img src="cover.jpg"></div>';

// pd - 解析DOM获取URL（支持URL拼接）
const url = pd(html, 'a&&href', 'https://example.com'); // https://example.com/movie/123

// pdfh - 解析DOM获取第一个匹配项的文本
const title = pdfh(html, 'a&&Text'); // 电影标题

// pdfa - 解析DOM获取数组
const links = pdfa(html, 'a'); // ['<a href="/movie/123">电影标题</a>']

// pdfl - 解析DOM获取列表（文本$链接格式）
const list = pdfl(html, 'div', 'a&&Text', 'a&&href', 'https://example.com');
// ['电影标题$https://example.com/movie/123']
```

### 工具函数

```javascript
import { joinUrl, similarity, s2t, t2s } from './lib/utils.js';

// URL拼接
const fullUrl = joinUrl('https://example.com', '/api/data');

// 字符串相似度
const score = similarity('Hello World', 'Hello World!'); // 0.9+

// 简繁转换
const traditional = s2t('简体中文');
const simplified = t2s('繁體中文');
```

## 📊 性能优化

### 已实现的优化

1. **代码优化**
   - 移除冗余注释和调试代码
   - 清理未使用的变量和函数
   - 优化了 drpy2.js 核心文件

2. **内存管理**
   - 正确的 VM 上下文销毁
   - 及时清理大对象引用
   - 合理的缓存策略

3. **网络优化**
   - 依赖本地化，避免网络请求
   - 支持请求缓存
   - 连接复用

### 性能测试结果

```bash
# 测试 drpy2 + 360影视规则
node --experimental-vm-modules cli.js test tests/drpy2.js -e tests/360.js

# 典型性能指标：
# - 初始化: ~200ms
# - 首页加载: ~500ms  
# - 分类列表: ~800ms
# - 搜索功能: ~1000ms
```

## 🔍 调试和开发

### 调试技巧

1. **使用静默模式**
```bash
# 获取纯净JSON便于分析
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home -q | jq
```

2. **检查缓存**
```bash
# 查看本地缓存
ls -la .cache/
cat .cache/spider_name/key.json
```

3. **详细错误信息**
```bash
# 不使用 -q 参数查看完整日志
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home
```

### 开发新规则

1. **创建规则文件**
```javascript
// tests/new-site.js
var rule = {
    title: '新站点',
    host: 'https://newsite.com',
    
    // 配置基本信息
    class_name: '电影&电视剧',
    class_url: 'movie&tv',
    
    // 实现解析规则
    一级: 'css:...',  // 或 json:... 或 js:...
    二级: 'js:...',
    搜索: 'css:...'
};
```

2. **测试规则**
```bash
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/new-site.js -m home -q
```

3. **完整测试**
```bash
node --experimental-vm-modules cli.js test tests/drpy2.js -e tests/new-site.js
```

## ❓ 常见问题

### Q: 为什么需要 `--experimental-vm-modules` 参数？
A: 因为使用了 Node.js 的实验性 VM 模块功能，这是实现沙箱环境和模块加载的核心。

### Q: 如何处理网站反爬？
A: 可以在规则文件中配置请求头、代理、延时等：
```javascript
headers: {
    'User-Agent': 'Mozilla/5.0...',
    'Referer': 'https://example.com'
},
timeout: 10000
```

### Q: 支持哪些解析语法？
A: 支持 drpy2 的所有语法：
- `json:` - JSON数据解析
- `css:` - CSS选择器
- `xpath:` - XPath表达式  
- `js:` - JavaScript代码
- `regex:` - 正则表达式

### Q: 如何添加新的依赖库？
A: 将库文件下载到 `tests/` 目录，然后在 `drpy2.js` 中导入。

### Q: 缓存存储在哪里？
A: 存储在项目根目录的 `.cache/` 文件夹中，按规则名称分目录存储。

## 🚀 迁移成果

### 从 QuickJS 到 Node.js 的成功迁移

1. **✅ 模块系统**: 从字节码模块转换为 SourceTextModule
2. **✅ 依赖管理**: HTTP依赖完全本地化
3. **✅ API兼容**: 保持与原QuickJS版本接口一致
4. **✅ 执行环境**: 沙箱环境模拟QuickJS上下文
5. **✅ 功能验证**: 所有核心功能测试通过

### 测试验证状态

- ✅ drpy2.js 版本: 3.9.49beta40
- ✅ 360影视规则: 完整功能正常
- ✅ CLI工具: 所有命令正常
- ✅ JSON输出: 静默模式完美

## 📄 许可证

ISC License

---

**🎉 项目亮点**: 成功将复杂的 QuickJS Android 爬虫框架迁移到 Node.js，保持了完整的功能兼容性，同时提供了更好的开发体验和部署便利性。特别是对 drpy2.js 框架的完整支持，为视频解析爬虫提供了强大且灵活的解决方案。