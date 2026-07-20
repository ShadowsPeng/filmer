# 胶片影像平台 — 技术方案

> 文档版本：v1.0
> 日期：2026-07-20
> 预算：¥3000-5000（零库存、纯抽成模式）

---

## 1. 技术架构总览

```
┌─────────────────────────────────────────────────────────┐
│                      微信小程序（前端）                      │
│               社区 Feed · 发布 · 话题 · 个人主页             │
├──────────────┬──────────────────┬───────────────────────┤
│   静态资源    │      Node.js      │       MySQL           │
│  （CDN 托管）  │    （BFF 层）      │     （主数据库）        │
│              │  聚合 + 鉴权 + 业务逻辑  │   用户 / 订单 / 资产  │
└──────────────┴──────────────────┴───────────────────────┘
                           │
                    Nginx（反向代理）
                           │
              ┌────────────┴────────────┐
              │      轻量应用服务器          │
              │   （腾讯云 / 阿里云最低配）    │
              │   1核2G · 2M带宽 · 50G硬盘   │
              └─────────────────────────┘
```

---

## 2. 技术栈选择

### 2.1 前端

| 选项                   | 选择     | 理由                               |
| -------------------- | ------ | -------------------------------- |
| **微信小程序**            | ✅ 必做   | 成本最低（¥300 认证费），流量入口好，无需安装        |
| **APP（iOS/Android）** | ✅ 必做   | Taro 4.x 一套代码编译到双端，增量成本低，覆盖非微信用户 |
| H5 / 公众号             | 备选     | 后期可扩展                            |
| React Web            | ❌ 暂不考虑 | 等 DAU 稳定后再考虑                     |

**前端技术方案：**

- 框架：**Taro 4.x**（React 语法，一套代码同时编译到微信小程序 + iOS + Android）
- 状态管理：**Zustand**（轻量，比 Redux 好上手）
- UI 组件：**NutUI**（京东开源，支持 Taro，适配小程序和 APP 双端）
- 图片 CDN：**腾讯云 COS**（免费额度够用，CDN 加速）
- APP 打包：**Android 使用 Android Studio / APKTool，iOS 使用 Xcode**，Taro CLI 构建后导入

### 2.2 后端

| 选项                 | 选择  | 理由                         |
| ------------------ | --- | -------------------------- |
| **Node.js（Koa）**   | ✅   | 上手快，生态成熟，和前端统一 JS 语言，学习成本低 |
| Python（FastAPI）    | 备选  | 数据分析功能上线后可能迁移部分逻辑          |
| Java / Spring Boot | ❌   | 成本高，初期不需要                  |
| PHP                | ❌   | 历史包袱重，不推荐新项目               |

**Node.js 技术方案：**

- 框架：**Koa 2.x**（轻量，中间件机制清晰）
- ORM：**Prisma**（类型安全，迁移方便，比 TypeORM 轻）
- 鉴权：**JWT**（简单够用）
- 校验：**Zod**（运行时校验，TypeScript 原生支持）
- 文件上传：**直传腾讯云 COS**，后端只存 URL

### 2.3 数据库

| 选项            | 选择     | 理由                           |
| ------------- | ------ | ---------------------------- |
| **MySQL 5.7** | ✅      | 轻量应用服务器跑得动，关系型数据够用（用户、订单、资产），兼容性好，稳定 |
| PostgreSQL    | 备选     | 更强，但比 MySQL 吃内存              |
| MongoDB       | ❌      | 初期数据结构简单，MySQL 足够            |
| Redis         | 可选，后期加 | 初期不用，DAU 过万后再加缓存层            |

**数据库工具：**

- 迁移：**Prisma Migrate**
- 可视化管理：**phpMyAdmin**（轻量，直接装在服务器上）

### 2.4 发版与部署

| 环节        | 工具                 | 说明                       |
| --------- | ------------------ | ------------------------ |
| **代码托管**  | GitHub / Gitea（自建） | 团队小，用 GitHub 免费版足够       |
| **CI/CD** | GitHub Actions     | 代码 push 后自动跑测试 + 部署，不花钱  |
| **服务器**   | 腾讯云轻量应用服务器         | 1核2G，约 ¥30/月，首年 ¥299     |
| **域名**    | 阿里云 / 腾讯云          | ¥20-50/年                 |
| **SSL**   | Let's Encrypt（免费）  | 自动续期，GitHub Actions 脚本里配 |
| **进程管理**  | PM2                | Node.js 生产环境必备           |
| **反向代理**  | Nginx              | 配 SSL 证书、做负载均衡（初期单台够用）   |
| **文件存储**  | 腾讯云 COS            | 免费额度：50G存储 + 10G流量/月     |
| **CDN**   | 腾讯云 CDN            | 小程序图片加载加速，接入 COS 更划算     |

---

## 3. 发版流程

### 3.1 微信小程序热更新

小程序使用**微信官方热更新机制**（`wx.getUpdateManager`），用户打开时自动检测更新，无需重新审核：

```
用户打开小程序
       ↓
wx.getUpdateManager() 检测是否有新版本
       ↓
有 → 下载完成后，下次启动时自动启用新版本
无 → 直接使用当前版本
```

**关键配置（在 `app.json` 中启用）：**

```json
{
  "lazyCodeLoading": "requiredComponents"
}
```

**代码实现（`app.ts`）：**

```typescript
import { updateApp } from '@/utils/update'

App({
  onLaunch() {
    updateApp() // 每次启动检查更新
  }
})
```

**update.ts 实现逻辑：**

```typescript
export const updateApp = () => {
  const updateManager = wx.getUpdateManager()

  updateManager.onUpdateReady(() => {
    wx.showModal({
      title: '更新提示',
      content: '新版本已准备好，是否重启应用？',
      success: (res) => {
        if (res.confirm) updateManager.applyUpdate()
      }
    })
  })

  updateManager.onUpdateFailed(() => {
    // 新版本下载失败，仍用旧版本，下次打开再重试
  })
}
```

> 注意：UI 组件/页面结构变更走审核通道，JS 逻辑变更走热更新，两者有区别。

### 3.2 后端热更新（PM2）

Node.js 后端使用 **PM2 实现零 downtime 热部署**：

```bash
# 手动热更新（生产环境）
pm2 reload server

# 监听文件变化自动重启（开发环境）
pm2 start src/index.js --watch
```

**PM2 热更新原理：**

- `pm2 reload` 先启动新进程，接收新请求
- 旧进程优雅关闭（处理完现有请求后再退出）
- 切换窗口约 1-2 秒，用户无感知

**ecosystem.config.js：**

```javascript
module.exports = {
  apps: [{
    name: 'film-server',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M'
  }]
}
```

### 3.3 CI/CD 自动化发版

> 触发条件：代码合并到 `main` 分支

```
push 代码到 main 分支
       ↓
GitHub Actions 自动触发
       ↓
① 拉取代码
② npm install 依赖
③ 跑单元测试（Jest）
④ 构建后端（ tsc build）
⑤ PM2 热更新（ pm2 reload server）
⑥ 构建小程序（ taro build --type weapp）
⑦ 自动推送到微信公众平台
⑧ 用户下次打开触发热更新
```

**手动发版（初期）：**

```bash
# 后端热更新
git pull && npm install && pm2 reload server

# 小程序（需人工上传审核）
taro build --type weapp && 微信公众平台手动上传
```

---

## 4. 目录结构

```
film-platform/
├── packages/
│   ├── app/              # 微信小程序前端（Taro）
│   │   ├── src/
│   │   │   ├── pages/    # 页面
│   │   │   ├── components/# 组件
│   │   │   ├── store/    # Zustand 状态
│   │   │   └── api/      # 请求封装
│   │   └── config/       # Taro 配置
│   │
│   └── server/           # Node.js 后端（Koa）
│       ├── src/
│       │   ├── router/   # 路由
│       │   ├── service/  # 业务逻辑
│       │   ├── model/    # Prisma Schema
│       │   └── middleware/# 中间件
│       ├── prisma/       # 数据库迁移
│       └── package.json
│
├── .github/
│   └── workflows/        # GitHub Actions CI/CD 配置
│
├── docker-compose.yml    # 本地开发 MySQL 5.7
└── README.md
```

---

## 5. 数据库 ER 概要

```
User ──────< Post（社区笔记）
  │              │
  │              └──< PostTag（笔记标签）
  │
  ├─────< Order（电商/租赁订单）
  │
  ├─────< RentalAsset（出租资产）───< RentalRecord（租赁记录）
  │
  └─────< Shop（入驻冲扫店 / 供应商）
```

---

## 6. 成本汇总

| 项目             | 首年费用       |
| -------------- | ---------- |
| 微信小程序认证        | ¥300       |
| 腾讯云轻量服务器（1核2G） | ¥299       |
| 域名             | ¥40        |
| 腾讯云 COS（免费额度内） | ¥0         |
| GitHub（免费版）    | ¥0         |
| **合计**         | **≈ ¥639** |

> 实际支出主要在服务器和认证费，后续流量起来了再加云服务。

---

## 7. 关键技术决策

| 决策点         | 选择          | 原因                           |
| ----------- | ----------- | ---------------------------- |
| 为什么不用 APP   | 小程序先跑       | 开发成本低，无需审核安装，流量入口现成          |
| 为什么用 Taro   | 统一多端        | 未来扩展到支付宝/京东小程序无需重写           |
| 为什么用 Prisma | ORM + 迁移一体化 | 比原生 SQL 好维护，TypeScript 支持好   |
| 为什么用 MySQL 5.7 | 兼容稳定         | MySQL 5.7 生态成熟，文档齐全，服务器兼容性最好 |
| 为什么用 PM2    | 进程管理        | 自动重启、负载监控、日志管理，生产必备          |
| 为什么用 COS    | 对象存储        | 免费额度够用，接入 CDN 后图片加载快         |

---

*本方案为 MVP 版本技术选型，Phase 2 扩展时需评估是否迁移至微服务架构。*
