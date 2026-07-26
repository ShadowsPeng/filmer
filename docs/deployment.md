# Filmer 0.1 生产部署

## 前提

- 已备案的 HTTPS API 域名
- Node.js 20、Nginx、PM2
- MySQL 8.0，且只允许应用服务器访问
- 微信小程序 AppID、AppSecret、支付商户证书、APIv3 key、微信支付公钥

## 首次部署

```bash
npm ci
npm run typecheck
npm test
npm run build:server
npm run prisma:generate:production --workspace=packages/server
npm run prisma:migrate:production --workspace=packages/server
pm2 start ecosystem.config.cjs
curl --fail https://api.filmer.example.com/health
```

将 `docs/nginx-filmer.conf` 中的示例域名替换后启用 Nginx。生产环境变量必须由服务器私有配置或密钥服务注入，不放入 Git。

## 定时关单

系统 cron 每分钟执行一次：

```cron
* * * * * cd /srv/filmer && npm run close-expired --workspace=packages/server >> /var/log/filmer-close-expired.log 2>&1
```

## 更新顺序

1. 拉取指定提交并执行 `npm ci`。
2. 执行类型检查、测试和后端构建。
3. 备份数据库。
4. 执行 `prisma:migrate:production`。
5. `pm2 reload ecosystem.config.cjs --update-env`。
6. 请求 `/health` 并检查支付回调日志。

## 回滚

代码故障：切回上一提交、重新构建并 reload PM2。数据库迁移不做自动 down；涉及破坏性 schema 变更时必须先写向后兼容迁移，并在发布前验证备份可恢复。

## 备份

每天执行 MySQL 全量备份，至少保留 30 天并复制到另一存储区域。每月在隔离数据库演练一次恢复，恢复成功才算备份有效。
