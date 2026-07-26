# Filmer · 胶片影像平台

> Phase 1 · 微信支付 MVP · 单场景「冲扫服务下单」

## 项目结构

```
film/
├── packages/
│   ├── app/          # Taro 4.x 微信小程序前端
│   └── server/       # Node.js + Koa 后端
├── docs/
│   ├── payment-setup.md        # 上线前 checklist
│   └── merchant-onboarding.md  # 营业执照 / 小程序 / 商户号 申请流程
├── .env.example
└── package.json      # 顶层 workspaces
```

## 快速开始(本地 mock 模式)

```bash
# 1. 安装依赖(约 3-5 分钟)
npm install

# 2. 准备数据库(本项目 MVP 用 sqlite, 零依赖)
npm run prisma:migrate
npm run prisma:seed

# 3. 准备 .env
cp .env.example packages/server/.env
# 默认 sqlite + local-mock, 可直接跑

# 4. 启动后端 + 微信小程序前端(两个进程)
npm run dev

# 5. 打开微信开发者工具,导入 packages/app,AppID 选「测试号」
#    关闭「不校验合法域名」,request 合法域名加 http://127.0.0.1:3000
```

## 跑测试

```bash
npm test
```

## 切到生产 / staging

修改 `packages/server/.env`:

```
WX_PAY_MODE=staging-live
WECHAT_APPID=<真实 AppID>
WECHAT_MCHID=<真实商户号>
WECHAT_API_V3_KEY=<32 字节 V3 密钥>
WECHAT_MERCHANT_CERT_PATH=<apiclient_cert.pem 绝对路径>
WECHAT_MERCHANT_KEY_PATH=<apiclient_key.pem 绝对路径>
WECHAT_MERCHANT_CERT_SERIAL_NO=<商户证书序列号>
WX_PAY_NOTIFY_URL=https://<你的域名>/api/payment/notify   # 必须公网 HTTPS
```

详细见 `docs/payment-setup.md` 和 `docs/deployment.md`。

生产发布前必须通过：

```bash
npm ci
npm run check
```

生产数据库使用 `packages/server/prisma/schema.mysql.prisma`，本地测试继续使用 SQLite。生产环境禁止运行 demo seed；订单超时关单由系统 cron 调用 `npm run close-expired --workspace=packages/server`。

## MVP 范围

只覆盖「冲扫服务下单」一个场景:单店 / C-41 或黑白 / 标准套餐 / 1-10 卷 / 无优惠券 / 无自动寄件码 / 单笔全额退款(管理员)。

购物车、租赁押金、会员订阅、Feed/笔记等 Phase 1 其他模块不在本次范围。

详细见 `C:\Users\peng\.claude\plans\velvet-imagining-bentley.md`。
