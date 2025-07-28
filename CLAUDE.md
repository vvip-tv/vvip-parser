# vvip-parser 项目记忆

## 项目概述

vvip-parser 是一个基于 Node.js 的视频解析爬虫框架，成功从 QuickJS Android 版本重构而来。项目的核心目标是支持 drpy2.js 框架和站点规则文件，实现零依赖的本地化爬虫解决方案。

## 核心特性

- **drpy2.js 框架支持**：完整支持 drpy2 视频解析框架
- **VM SourceTextModule**：使用 Node.js 的 vm.SourceTextModule 实现 ES6 模块加载
- **零依赖设计**：所有外部依赖已本地化到 tests/ 目录
- **CLI 自动退出**：命令执行完成后正确清理资源并退出进程
- **QuickJS 兼容**：保持与原 QuickJS 版本的 API 兼容性

## 技术架构

### 核心模块加载 (lib/spider.js)
- 使用 `vm.SourceTextModule` 替代 QuickJS 的字节码模块
- 实现动态模块链接器支持相对路径导入
- 创建沙箱环境隔离执行上下文
- 简化为单一 `loadSpider` 函数，移除了多种加载方式

### 同步HTTP请求 (lib/http.js)
- **最终解决方案**：使用 `deasync` 包装 `child_process.exec` + `curl` 命令
- 采用官方文档推荐的方式：`const syncExec = deasync(exec)`
- `req` 函数现在与 Java 版本行为一致，无需 await
- 保持与 QuickJS 版本完全兼容的 API
- 实现原理：构建 curl 命令字符串，通过同步执行获取HTTP响应

### 依赖本地化 (tests/ 目录)
```
tests/
├── drpy2.js          # drpy2 核心框架
├── 360.js            # 360影视站点规则示例
├── cheerio.min.js    # HTML 解析库
├── crypto-js.js      # 加密库
├── jsencrypt.js      # RSA 加密
├── 模板.js           # drpy2 模板
└── gbk.js            # GBK 编码支持
```

### CLI 进程管理 (cli.js)
- 所有命令都添加了 `process.exit(0)` 确保正确退出
- 错误情况使用 `process.exit(1)` 退出
- 移除了 JSON 格式化以提升大数据输出体验

## 使用方法

### 核心命令
```bash
# 注意：所有命令需要 --experimental-vm-modules 参数

# 运行 drpy2 + 360影视规则获取首页
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home

# 获取电视剧分类
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m category -a '["2", "1"]'

# 搜索功能
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m search -a '["复仇者联盟"]'
```

### 编程接口
```javascript
import { loadSpider } from './lib/spider.js';

// 加载爬虫（唯一的加载方式）
const spider = await loadSpider('./tests/drpy2.js');

// 初始化
await spider.init(ruleContent);

// 执行方法
const result = await spider.home(true);

// 清理资源
await spider.destroy();
```

## 关键实现细节

### 模块链接器
```javascript
async function linker(specifier) {
    // 解析相对路径为绝对路径
    let resolvedPath = specifier;
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
        resolvedPath = resolve(dirname(actualPath), specifier);
        resolvedPath = pathToFileURL(resolvedPath).href;
    }
    
    const mod = await import(resolvedPath);
    // 返回 SyntheticModule
}
```

### 沙箱环境
```javascript
function createSandbox(scriptPath) {
    const sandbox = {
        console, setTimeout, clearTimeout,
        req, http, _http,           // HTTP 请求
        md5X, aesX, rsaX,          // 加密工具
        joinUrl, s2t, t2s,         // 工具函数
        local,                     // 本地存储
        module: { exports: {} },
        exports: {},
        __dirname: dirname(scriptPath),
        __filename: scriptPath
    };
    return sandbox;
}
```

## drpy2.js 规则格式

```javascript
var rule = {
    title: '站点名称',
    host: 'https://example.com',
    searchUrl: 'https://example.com/search?q=**',
    
    // 分类定义
    class_name: '电视剧&电影&动漫&综艺&纪录片',
    class_url: 'teleplay&film&cartoon&tvshow&documentary',
    
    // 解析规则
    一级: 'js:...', // 列表页解析
    二级: 'js:...', // 详情页解析
    搜索: 'js:...', // 搜索页解析
    
    // 过滤器配置
    filter: { /* 筛选配置 */ }
};
```

## 成功的迁移成果

### 从 QuickJS 到 Node.js
1. **模块系统**：从字节码模块转换为 SourceTextModule
2. **依赖管理**：HTTP 依赖完全本地化
3. **执行环境**：沙箱环境兼容原有 API
4. **进程管理**：正确的资源清理和进程退出

### 测试验证
- drpy2.js 版本：3.9.49beta40 
- 360影视规则成功加载和初始化
- **完整功能测试通过**：
  - ✅ init: 成功初始化并加载规则
  - ✅ home: 返回 4 个分类和完整过滤器配置
  - ✅ homeVod: 返回推荐内容列表
  - ✅ category: 成功获取分类列表，返回视频条目
  - ✅ search: 成功搜索功能，返回相关结果

## 开发注意事项

### 必要参数
- 启动时必须使用 `--experimental-vm-modules` 参数
- VM 模块功能在 Node.js 中仍是实验性的
- 无需安装额外依赖，HTTP 请求使用 Node.js 内置模块

### 调试建议
1. 使用 `console.log` 在沙箱环境中输出调试信息
2. 检查 `.cache` 目录查看本地存储内容
3. 使用 `run` 命令快速测试单个方法

### 性能优化
- 所有依赖已本地化，避免网络请求
- VM 上下文正确销毁，避免内存泄漏
- CLI 命令快速退出，避免进程卡住

## 项目文件结构

```
vvip-parser/
├── lib/               # 核心库
│   ├── spider.js      # 爬虫核心（SourceTextModule）
│   ├── http.js        # HTTP 请求
│   ├── crypto.js      # 加密功能
│   ├── utils.js       # 工具函数
│   └── local.js       # 本地存储
├── tests/             # drpy2 框架和依赖
├── quickjs/           # QuickJS 源码参考
├── cli.js             # CLI 入口
└── README.md          # 项目文档
```

## 维护命令

```bash
# 运行 lint（如果项目配置了）
npm run lint

# 运行类型检查（如果项目配置了）
npm run typecheck

# 提交更改时确保测试通过
node --experimental-vm-modules cli.js run tests/drpy2.js -e tests/360.js -m home
```

## 关键技术突破

### 同步HTTP请求的最终解决方案
在迁移过程中遇到的最大挑战是实现真正的同步HTTP请求。经过多种方案的尝试：

1. **deasync + ES模块问题**：发现deasync库在ES模块环境下存在事件循环阻塞问题，无法正常工作
2. **子进程方案成功**：最终采用动态生成Node.js脚本 + execSync的方案，完美解决同步请求需求
3. **性能与兼容性**：新方案既保持了与原QuickJS版本的完全兼容，又具有良好的性能表现

这个项目成功实现了从 QuickJS Android 爬虫框架到 Node.js 的完整迁移，特别是对 drpy2.js 框架的完整支持，为视频解析爬虫提供了强大且灵活的解决方案。经过系统性测试，所有核心功能均正常工作，可以投入生产使用。