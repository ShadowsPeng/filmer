# 微信支付上线前 Checklist

> 当你申请到真实 AppID / 商户号 / 证书后,这份文档告诉你:
> 1. 在 `.env` 里改哪些变量
> 2. 哪些代码需要补(因为 staging-live / production-live 才有意义)
> 3. 上线前必须打的勾

---

## Step 1 · 拿到以下 6 个东西

| # | 物品 | 来源 |
|---|---|---|
| 1 | 微信小程序 AppID(企业认证) | 微信公众平台 mp.weixin.qq.com |
| 2 | 微信支付商户号 mch_id | pay.weixin.qq.com 商户平台 |
| 3 | API v3 密钥(32 字节) | 商户平台 · API 安全 · APIv3 密钥 |
| 4 | 商户 API 证书 `apiclient_cert.pem` | 商户平台 · API 安全 · 申请 API 证书 |
| 5 | 商户 API 证书私钥 `apiclient_key.pem` | 同上,生成时一次性下载,丢失需重新申请 |
| 6 | 商户证书序列号(商户平台显示) | 商户平台 API 安全页 |

**强烈推荐**额外申请:
- 微信支付公钥(替代平台证书自动轮换):商户平台 · API 安全 · 申请微信支付公钥。下载后的 `public_key.pem` 路径填到 `WECHAT_PUBLIC_KEY_PATH`。

## Step 2 · 修改 `packages/server/.env`

```bash
WX_PAY_MODE=staging-live                # 联调期;生产改为 production-live

WECHAT_APPID=<填 1>
WECHAT_MCHID=<填 2>
WECHAT_API_V3_KEY=<填 3,32 字节>
WECHAT_MERCHANT_CERT_PATH=<绝对路径>/apiclient_cert.pem
WECHAT_MERCHANT_KEY_PATH=<绝对路径>/apiclient_key.pem
WECHAT_MERCHANT_CERT_SERIAL_NO=<填 6>

WECHAT_PUBLIC_KEY_PATH=<绝对路径>/public_key.pem   # 推荐

WX_PAY_NOTIFY_URL=https://<你的备案域名>/api/payment/notify
```

启动时若字段缺失/不合法,后端启动直接退出,日志中会列出问题字段。

## Step 3 · 代码层面补 3 处(线上必修)

文件: `packages/server/src/router/payment.ts`

1. **回调签名校验**:`/api/payment/notify` handler 中,真实模式下读取 header
   - `Wechatpay-Timestamp`
   - `Wechatpay-Nonce`
   - `Wechatpay-Signature`
   - `Wechatpay-Serial`
   用 `verifyWxResponse()` + 平台证书(或 `WECHAT_PUBLIC_KEY_PATH`)做验签;失败直接 401。
   平台证书需要从 `/v3/certificates` 下载并缓存(轮换缓存逻辑见 plan agent 提示)。
2. **微信登录接入**:`packages/server/src/router/auth.ts` 增加 `/api/auth/wx-login` 端点:
   - 接 `code`(wx.login 回调)
   - 调 `code2Session` 拿 openid/unionid/session_key
   - 自有 user 表 upsert,签 JWT 返回
3. **微信小程序前端**:`packages/app/src/utils/payment.ts` 中 `ENV.WX_PAY_MODE='staging-live'` 后,`requestWechatPay` 走真实 `Taro.requestPayment(...)`。

## Step 4 · 上线前 checklist

- [ ] 个体工商户营业执照 + ICP 备案域名(必须有)
- [ ] 微信小程序企业认证 + 关联商户号(主体一致)
- [ ] 经营类目审核通过(摄影服务 / 文娱 视情况)
- [ ] 隐私政策 / 用户协议 / 退款政策 上架小程序(必填)
- [ ] 商业模式 = 平台自营 已确认,二清风险自评签字
- [ ] notify_url 是 **公网 HTTPS**(不是 ngrok/局域网)
- [ ] 已跑通 staging-live 真机 5 笔交易:4 成功 + 1 超时关单 + 1 退款
- [ ] 关单定时器接入(下单 30 分钟未支付自动关)
- [ ] 数据库备份策略(mysqldump 定时)
- [ ] 日志脱敏检查(不要打印手机号 / 完整 openid)
- [ ] 误删保护:商户证书私钥不进 git(`*.pem` 已在 `.gitignore`)
- [ ] 沙箱密钥 vs 生产密钥严格隔离(绝对不要混)

## Step 5 · 切到 production-live

```bash
WX_PAY_MODE=production-live
# 其他变量从 staging 复用即可(注意是同一个商户号同一套证书)
```

启动后:
- 商户平台 → 交易流水 应能看见真实交易
- 回调日志应能找到 `[notify] ok` 行
- 数据库 `PaymentAttempt.status` 自动由 `pending` → `success`

---

## 排错速查

| 现象 | 排查 |
|---|---|
| 后端启动报 `❌ 支付模式 = staging-live,但必填的微信支付凭证缺失` | `.env` 字段名打错或大小写不一致 |
| 启动 `signRequest` throw `Merchant key not loaded` | 检查 `WECHAT_MERCHANT_KEY_PATH` 文件存在且是 `-----BEGIN PRIVATE KEY-----` 头 PEM |
| 回调 401 微信不发 | `Wechatpay-Signature` 验签失败,通常是 `WECHAT_PUBLIC_KEY_PATH` 指向了错证书 / 序列号 mismatch |
| wx.requestPayment 报 "商户号和 appid 不匹配" | 小程序 AppID 与商户号没绑定,或主体不一致 |
| 退款报 "用户支付单未结算" | 用户实际未付或 `paid=0`,订单未推进到 paid |
| 关单 30 分钟仍 pending | 关单定时器未配;MVP 没接入定时任务 |
