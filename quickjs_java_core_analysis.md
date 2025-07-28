# QuickJS Java 核心逻辑分析文档

## 架构概述

这是一个基于 Android 的 QuickJS 爬虫框架，使用 Java 封装 QuickJS 引擎，执行 JavaScript 爬虫脚本。

## 核心组件

### 1. Provider.java
- **功能**: Android ContentProvider，负责初始化 QuickJS 环境
- **关键操作**: 静态块中调用 `QuickJSLoader.init()` 初始化 QuickJS

### 2. Spider.java (核心爬虫类)
- **继承**: `com.github.catvod.crawler.Spider`
- **功能**: 爬虫接口实现，桥接 Java 和 JavaScript

#### 主要特性：
- 单线程执行器确保 JS 操作线程安全
- 支持异步调用和回调
- 实现标准爬虫接口方法

#### 关键方法：
```java
- init(Context, String) - 初始化爬虫
- homeContent(boolean) - 获取首页内容
- categoryContent(...) - 获取分类内容
- detailContent(List<String>) - 获取详情
- searchContent(...) - 搜索内容
- playerContent(...) - 播放器内容
- proxyLocal(...) - 本地代理
```

#### 初始化流程：
1. 创建 QuickJS 上下文
2. 设置控制台输出
3. 加载 HTTP 库
4. 绑定全局方法
5. 加载并执行爬虫脚本

### 3. 方法绑定机制

#### Console.java
- 实现 QuickJS 控制台接口
- 将 JS console 输出重定向到 Android 日志

#### Global.java (全局方法)
使用 `@JSMethod` 注解自动绑定到 JS 全局对象：
- `s2t/t2s` - 简繁体转换
- `getProxy` - 获取代理地址
- `setTimeout` - 定时器实现
- `_http/req` - HTTP 请求
- `joinUrl` - URL 拼接
- `md5X` - MD5 加密
- `aesX` - AES 加密/解密
- `rsaX` - RSA 加密/解密

#### Local.java (本地存储)
- `get(rule, key)` - 读取缓存
- `set(rule, key, value)` - 写入缓存
- `delete(rule, key)` - 删除缓存

### 4. 工具类

#### Connect.java (HTTP 连接)
- 封装 OkHttp 请求
- 支持多种请求方式（GET/POST/HEAD）
- 支持表单、JSON、FormData 等数据格式
- 自动处理响应格式（文本/二进制/Base64）

#### Module.java (模块加载器)
- 实现 JS 模块加载
- 支持加载来源：
  - HTTP URL
  - assets 资源
  - 本地缓存
- 自动缓存远程模块

#### Crypto.java (加密工具)
- MD5 哈希
- AES 加密/解密（支持多种模式）
- RSA 加密/解密（支持分块处理）

#### JSUtil.java
- Java 和 JS 对象转换工具

#### Async.java
- 异步执行 JS 函数

### 5. 数据模型

#### Req.java
HTTP 请求配置：
- method - 请求方法
- header - 请求头
- data - 请求数据
- postType - POST 数据类型
- timeout - 超时时间
- redirect - 是否重定向
- buffer - 响应缓冲类型
- charset - 字符编码

#### Res.java
代理响应结果：
- code - 状态码
- contentType - 内容类型
- content - 响应内容

## 执行流程

1. **初始化阶段**
   - Provider 初始化 QuickJS
   - Spider 创建 QuickJS 上下文
   - 加载必要的 JS 库和全局方法

2. **脚本加载**
   - Module 加载器获取爬虫脚本
   - 检测脚本类型（cat 或标准）
   - 创建 __JS_SPIDER__ 全局对象

3. **方法调用**
   - Java 通过 `call()` 方法调用 JS 函数
   - 参数自动转换（Java ↔ JS）
   - 异步执行确保线程安全

4. **网络请求**
   - JS 调用全局 HTTP 方法
   - Connect 处理实际网络请求
   - 支持同步和异步模式

## 关键特性

1. **线程安全**: 所有 JS 操作在单线程执行器中执行
2. **模块化**: 支持 ES 模块和动态加载
3. **缓存机制**: 自动缓存远程模块和本地存储
4. **加密支持**: 内置常用加密算法
5. **代理功能**: 支持本地代理转发

## txiki.js 重构要点

使用 txiki.js 重构时需要实现：

1. **全局方法映射**
   - HTTP 请求（req/_http）
   - 加密函数（md5X/aesX/rsaX）
   - 工具函数（joinUrl/s2t/t2s）
   - 本地存储（local.get/set/delete）

2. **模块加载器**
   - 支持 HTTP/本地文件加载
   - 模块缓存机制

3. **爬虫接口**
   - 实现标准爬虫方法
   - 处理参数转换
   - 支持异步调用

4. **代理功能**
   - 本地 HTTP 代理服务器
   - 请求转发和响应处理