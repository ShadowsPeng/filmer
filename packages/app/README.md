# Filmer · 微信小程序前端(Taro 4.x)

## 开发

```bash
# 1. 启动后端(另一终端)
cd ../server
cp ../../.env.example .env
npm install
npx prisma db push
npm run prisma:seed
npm run dev          # 监听 127.0.0.1:3000

# 2. 启动本目录
cd ../app
npm install
npm run dev:weapp    # 编译 dist/ 为微信小程序产物,watch 模式
```

## 微信开发者工具

- 导入本目录(不是 `dist/`,是上一层的 app 目录)
- AppID:开发期选「测试号」
- 关闭「不校验合法域名」(开发设置 → 项目设置)
- request 合法域名:`http://127.0.0.1:3000`

## 目录

```
src/
├── pages/
│   ├── index/              # Feed 占位
│   ├── scan/
│   │   ├── list.tsx        # 冲扫店列表
│   │   └── detail.tsx      # 套餐选择
│   ├── order/
│   │   ├── confirm.tsx     # 下单确认
│   │   └── result.tsx      # 支付结果轮询
│   ├── order-detail/
│   │   └── index.tsx       # 订单详情 + 时间线
│   └── profile/
│       └── index.tsx       # 我的 + 登录
├── api/                    # Taro.request 封装
├── store/                  # Zustand
├── utils/                  # wx.requestPayment + env
└── types/                  # 前后端共享类型
```

## 跑测试

本目录无单元测试(关键路径依赖微信开发者工具)。手动验证清单见顶层 README。
