# Filmer 项目迭代日历(Phase 0 → Phase 1)

> 起始日:2026-07-22
> 总跨度:14 周
> 战略前提:**冲扫服务下单**是 Phase 1 首个 MVP 场景,微信支付须先于此打通端到端闭环
> 当前工程状态:0 行业务代码;只有 PRD/BRD/技术方案/HTML 原型可作为依据

---

## 一、关键依赖申请(Week 0,必须先并行启动)

这些是接入微信支付的前置硬依赖,**不能等到 Phase 1a 才申请**:

| 依赖项 | 负责人 | 启动日 | 必须就绪日 | 备注 |
|---|---|---|---|---|
| 微信小程序账号(企业认证) | 宋润芃 | D0 | W3 末 | ¥300/年 |
| 微信支付商户号(企业版) | 宋润芃 | D0 | W4 末 | 需营业执照 |
| 微信支付 APIv3 密钥 + 证书 | 后端 | D0 | W4 末 | 商户后台自助 |
| 腾讯云轻量服务器(1C2G) | 宋润芃 | D0 | W1 末 | ¥299/年 |
| 域名 + SSL(Let's Encrypt) | 宋润芃 | D0 | W2 末 | |
| 顺丰电子面单 API 沙箱 | 待定 | W2 | W6 末 | 冲扫需寄件码 |
| 冲扫店首批合作(≥3 家) | BD | D0 | W6 末 | 联营结算前提 |
| 胶卷供应商(≥2 家) | BD | W2 | W8 末 | 商城 SKU 种子 |

---

## 二、Phase 拆分(与 PRD §13 对齐)

| 阶段 | 周次 | 范围 | 北极星 |
|---|---|---|---|
| **Phase 0a** | W1-W3 | 用户系统 + 内容社区(Feed/发布/详情/评论/话题) | 完成「注册 → 发卷 → 互动」 |
| **Phase 0b** | W4-W6 | KOL 入驻 + 通知中心 + 个人主页 | 邀请 10 个 KOL 入驻并发卷 |
| **Phase 1a-α** | W7-W8 | **冲扫服务下单 + 微信支付**(首个 MVP 端到端闭环) | 完成「选店 → 下单 → 微信支付 → 寄件码」 |
| **Phase 1a-β** | W9-W10 | 租赁服务 + 电商 MVP | 用户能完成「租赁下单 / 电商下单」 |
| **Phase 1b** | W11-W13 | 冲扫进度可视化、会员订阅、搜索 | 用户能完成「委托 / 订阅 / 搜索」 |
| **Phase 1 验收** | W14 | 全量验收 + 灰度发布 | 通过 PRD §12 验收标准 |

---

## 三、详细周历(W1 - W14)

### Phase 0a:基础底座(W1 - W3)

#### W1(07-22 → 07-28)— 基础设施 + 项目骨架

| 任务 | 产出 | 负责人 | Exit Criteria |
|---|---|---|---|
| 初始化 monorepo(npm workspace) | `package.json`、`tsconfig.json`、`packages/app`、`packages/server` | 全栈 | `npm run dev` 可起双端 |
| 搭建 Koa + Prisma + sqlite 基础 | `prisma/schema.prisma`、`src/index.ts` | 后端 | `prisma db push` 通过 |
| 搭建 Taro 4.x 项目 | `packages/app`、Zustand | 前端 | 微信开发者工具能打开 |
| 设计系统 Token 落地 | `app.scss`、VI 主题对齐 | 前端 | |

#### W2(07-29 → 08-04)— 用户系统 + 鉴权

| 任务 | 产出 |
|---|---|
| User/Openid/Unionid 数据模型 | Prisma schema |
| 微信一键登录接口(`code2Session`) | `POST /api/auth/wx-login` |
| JWT 签发与中间件 | `middleware/auth.ts` |
| 手机号兜底登录(Phase 2) | `POST /api/auth/phone-login` |
| Taro 登录页 + 鉴权拦截 | `pages/profile/index.tsx` |

#### W3(08-05 → 08-11)— 内容社区 MVP

| 任务 | 产出 |
|---|---|
| Note/Topic/Comment 数据模型 | Prisma schema |
| Feed 列表 + 详情接口 | `GET /api/feed`、`GET /api/notes/:id` |
| 发布笔记 + 微信 `wx.chooseMedia` + COS 直传 | `POST /api/notes` |
| Taro Feed/详情/发布/话题页 | `pages/feed/*` |
| Phase 0a DoD:完成「注册 → 发卷 → 互动」 | 内部演示通过 |

### Phase 0b:KOL 与通知(W4 - W6)

#### W4(08-12 → 08-18)— KOL 入驻 + 个人主页

| 任务 | 产出 |
|---|---|
| KOL 申请表单 + 审核流 | `POST /api/kol/apply`、`POST /api/kol/review` |
| 个人主页 + 关注/粉丝 | `GET /api/users/:id`、`POST /api/follow` |
| KOL 徽章 + 流量加权(+20%) | Feed 排序逻辑 |
| 微信支付商户号到位 + APIv3 密钥配置 | `.env` 注入 |

#### W5(08-19 → 08-25)— 通知中心

| 任务 | 产出 |
|---|---|
| Notification 数据模型 | Prisma schema |
| 站内消息聚合 + 未读数 | `GET /api/notifications` |
| 微信订阅消息模板申请 | 模板 ID |
| KOL 邀约流程(≥10 个) | 商务落地 |

#### W6(08-26 → 09-01)— 0b 收尾 + Phase 1 准备

| 任务 | 产出 |
|---|---|
| 内容审核(机审 + 敏感词库) | 中间件 |
| Phase 0b DoD:10 个 KOL 发卷 | 演示通过 |
| 冲扫店 BD 落地首批 ≥3 家 | 商务合同 |
| 顺丰 API 沙箱对接 | 单号生成接口 |

### Phase 1a-α:冲扫服务 + 微信支付(W7 - W8)— **当前核心**

> 这是微信支付接入方案的首个端到端落地节点。

#### W7(09-02 → 09-08)— 冲扫数据模型 + 订单创建

| 任务 | 产出 | 文件建议 |
|---|---|---|
| Shop / DevelopService / DevelopOrder 数据模型 | Prisma schema | `packages/server/prisma/schema.prisma` |
| 冲扫店列表 + 详情 + 价格表接口 | `GET /api/scan/shops`、`GET /api/scan/shops/:id` | `packages/server/src/router/scan.ts` |
| 冲扫委托下单接口(pending_pay) | `POST /api/orders` | `packages/server/src/router/order.ts` |
| 订单号生成(年份+日+序号) | util | `packages/server/src/service/order.ts` |
| 微信支付 V3 集成 | `lib/wxpay/*` | `packages/server/src/lib/wxpay/` |
| 后端「创建预支付订单」接口 | `POST /api/payment/jsapi` | `packages/server/src/router/payment.ts` |
| 前端「冲扫委托下单」页 | `pages/order/confirm.tsx` | `packages/app/src/pages/order/` |

#### W8(09-09 → 09-15)— 微信支付调起 + 回调

| 任务 | 产出 |
|---|---|
| 前端 `wx.requestPayment` 调起 | `utils/payment.ts` |
| 后端「支付回调」接口(验签 + 解密 + 幂等) | `POST /api/payment/notify` |
| 订单状态推进 `pending_pay → paid` | 状态机 |
| 顺丰寄件码生成 + 推送给用户 | `POST /api/orders/:id/ship-code` |
| 「支付中途断网 → 客户端轮询」 | `GET /api/orders/:id`(result.tsx 轮询) |
| 30 分钟超时未支付 → 自动关闭 | `closeExpiredOrders()` cron |
| **Phase 1a-α DoD**:用户能完成「选店 → 下单 → 微信支付 → 收到寄件码」 | 灰度发布 |

### Phase 1a-β:租赁 + 电商(W9 - W10)

#### W9(09-16 → 09-22)— 租赁

| 任务 | 产出 |
|---|---|
| RentalAsset / RentalOrder 数据模型 | Prisma |
| 押金 → 微信代扣(v3 `transfers/funds-to-owe`) | 支付服务扩展 |
| 租金 + 保险 → 微信支付(同冲扫通路) | 复用 `payment.service.ts` |
| 归还 → 押金解冻(解冻 API 或原路退款) | `POST /api/rental/orders/:id/return` |

#### W10(09-23 → 09-29)— 电商

| 任务 | 产出 |
|---|---|
| Product / SKU / Cart / Order 数据模型 | Prisma |
| 普通微信支付(JSAPI) | 复用 `payment.service.ts` |
| 商品 / 购物车 / 订单确认 / 订单详情 | Taro 页 |

### Phase 1b:会员 + 进度 + 搜索(W11 - W13)

#### W11(09-30 → 10-06)— 冲扫进度 + 物流

| 任务 | 产出 |
|---|---|
| 冲扫时间线 5 节点 | `GET /api/orders/:id/timeline` |
| 顺丰物流 webhook 接入 | `POST /api/ship/notify` |
| 售后申请(返图后 7 天内) | `POST /api/orders/:id/dispute` |

#### W12(10-07 → 10-13)— 会员订阅

| 任务 | 产出 |
|---|---|
| Member / Subscription 数据模型 | Prisma |
| 微信支付「微信支付分」/ 委托代扣 / 普通订阅 | 三选一决策 |
| 每月冲扫代金券发放(cron) | `cron/coupon.ts` |
| 续费协议页 + 自动续费开关 | `pages/profile/upgrade.tsx` |

#### W13(10-14 → 10-20)— 搜索 + 退款闭环

| 任务 | 产出 |
|---|---|
| 关键词 + 话题 + 用户 + 商品混合搜索 | `GET /api/search` |
| 商城退款(原路退回 APIv3) | `POST /api/admin/refunds` |
| 退款状态机 `refunding → refunded` | 状态机 |
| 退款回调 + 幂等 | `POST /api/payment/refund-notify` |

### Phase 1 验收(W14)

#### W14(10-21 → 10-27)— 灰度发布

| 任务 | 退出标准 |
|---|---|
| 全量接口 P95 < 500ms 压测 | PRD §10.1 |
| 错误日志接入 Sentry | PRD §10.5 |
| 异常场景全部通过(支付断网、超时、退款、库存) | PRD §11 |
| 真实 KOL 5-10 人体验发卷 | UAT |
| 真实用户 3-5 人走通「租赁 / 电商 / 冲扫」 | UAT |
| 渗透测试(Phase 2 启动前) | PRD §12.3 |
| 灰度发布 5% → 20% → 100% | 运营 |

---

## 四、支付接入方案关键决策点(需在 W4 前敲定)

由于这些决策直接影响 W7 微信支付联调,请提前在 W4 商户号到位前对齐:

| 决策点 | 选项 | 推荐 | 理由 |
|---|---|---|---|
| 支付 API 版本 | v2 / v3 | **v3** | 微信官方推荐,RSA 验签更稳 |
| 收单主体 | 普通商户 / 服务商 | 普通商户(Phase 1)→ 服务商(Phase 3) | 简化接入;分账后续再升级 |
| 押金实现 | 微信代扣 / 预授权 / 单笔收款后退款 | **微信支付分(免押场景)**或**预授权** | 见 PRD §6.2.5 |
| 退款方式 | 原路退回 / 余额 | **原路退回** | 用户预期明确 |
| 分账 | 暂缓 / 同步 | **暂缓 Phase 1**,异步 Phase 3 切服务商 | 冲扫店结算用线下对账过渡 |
| 会员自动续费 | 微信支付「商户免密代扣」 | ✅ | PRD 明确要求 |

---

## 五、风险与回滚

| 风险 | 触发条件 | 缓解 | 回滚方案 |
|---|---|---|---|
| 微信支付联调阻塞 | 商户号 W4 末未到 | 提前并行申请 | 切支付宝 + 微信 H5 兜底 |
| 顺丰 API 异常 | 寄件码生成失败 | 预留京东物流 API | 切京东 |
| 冲扫店合作破裂 | 1 家退出 | 同时签约 3 家 | 切换到剩余店 |
| 押金代扣政策变化 | 微信支付分调整 | 改用「单笔收款 + 归还退款」 | 流程改造 ≤2 周 |
| 服务器宕机 | 1C2G 跑不动 | 监控 + 备份 | PM2 自动重启 + 备用域名 |

---

## 六、节奏图(甘特摘要)

```
W1  ████ 项目骨架 + 基础设施
W2  ████ 用户系统 + 鉴权
W3  ████ 内容社区 MVP
W4  ████ KOL + 个人主页 + 商户号到位
W5  ████ 通知中心 + 微信模板
W6  ████ 0b 收尾 + 顺丰对接 + BD 落地
W7  ████ 冲扫数据模型 + 下单 + 微信支付 SDK
W8  ████████ 微信支付联调 + 回调 + 寄件码
W9  ████ 租赁(押金 + 租金双通道)
W10 ████ 电商 MVP
W11 ████ 冲扫进度 + 物流 + 售后
W12 ████ 会员订阅 + 自动续费
W13 ████ 搜索 + 退款闭环
W14 ████████ 全量验收 + 灰度发布
```

---

## 进度更新(2026-07-22)

- ✅ 微信支付 MVP 代码骨架完成(`packages/server` + `packages/app`)
- ✅ 22/22 单测通过,typecheck clean
- ✅ Mock 端到端跑通(下单 → 支付 → 回调 → 退款 → 订单状态机)
- ⏳ 待启动:办理小程序 / 商户号 / ICP 备案(2-4 周)
- ⏳ 待启动:启动 W2 鉴权(微信一键登录)+ W3 Feed
- 📋 详见 `docs/payment-setup.md` 切换 staging/production 步骤
