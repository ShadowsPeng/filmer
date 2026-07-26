# 胶片封面图策略(待决策)

> 整理时间:2026-07-22
> 状态:**待用户决策** — 这是 Phase 1a-α(W7 冲扫服务)的前置,不在当前微信支付 MVP 范围内
> 调研范围:PRD §6.1.3 列出的胶卷库候选 30 个主流型号

---

## ⚠️ 调研时的硬性限制

调研 agent 只能 WebSearch / WebFetch,**不能下载图片到磁盘**。本文件是可达性盘点 + 策略选项,实际抓图由 BD / 后端执行。

---

## 一、官方页面可达性盘点(主要 SKU)

| 胶片 SKU | 官方页面 | 可达性 | 备注 |
|---|---|---|---|
| Kodak E100 120 | `kodak.com/en/motion/product/film/kodak-professional-ektachrome-e100/120-size-single-roll` | ✅ | Kodak 已把胶片业务划到 Motion 分类 |
| Kodak E100 120 (5-pack) | `kodak.com/.../120-size-5-pack` | ✅ | |
| Kodak Ektar 100 | `kodak.com/en/motion/products/product-formats/ektar-100` | ⚠️ 404 | URL 已失效或下架 |
| Kodak Portra 400 135 | `kodak.com/en/motion/page/portra-400-film` | ⚠️ | Portra 400 135 停产,主力转 120/页片 |
| Kodak Portra 400 120 | 类似路径 | ⚠️ | URL 频繁变动,建议查 `kodak.com/en/motion` 导航 |
| Fuji Velvia 50 135 | ❌ 无 | 已停产 | 仅剩 120/4×5 |
| Fuji Velvia 50 120 | fujifilm.com 历史档案 | ✅ 旧版可访问 | |
| Fuji Provia 100F 135 | `fujifilm.com.hk/.../provia_100f/` | ✅ 港版有效 | 全球站已撤 |
| Ilford HP5 Plus 35/120 | `ilfordphoto.com` | ⚠️ | 需要浏览主导航 |
| Cinestill 5207 250D | cinestillfilm.com | ✅ 独立站活跃 | |

引用:`product/PRD-Filmer-MVP.md:486-488`

## 二、WebSearch 命中的真实 URL(已搜到)

| SKU | 命中页面 |
|---|---|
| Kodak E100 120 single roll | https://www.kodak.com/en/motion/product/film/kodak-professional-ektachrome-e100/120-size-single-roll |
| Kodak E100 120 5-pack | https://www.kodak.com/en/motion/product/film/kodak-professional-ektachrome-e100/120-size-5-pack |
| Kodak E100 120 on B&H | https://www.bhphotovideo.com/c/product/1303166-REG/kodak_1725863_ektachrome_e100_120_film.html |
| Kodak E100 120 on Adorama | https://www.adorama.com/ikod120v.html |
| Fuji Provia 100F(港版) | https://www.fujifilm.com.hk/products/professional_films/color_reversalfilms/provia_100f/ |

## 三、版权与商用边界(必须明确)

| 来源 | 商用风险 | 建议 |
|---|---|---|
| kodak.com 官网图 | 中等,需授权 | 内部演示 OK,**上架前需联系 Kodak Alaris 商务** |
| fujifilm.com 官网图 | 中等,需授权 | 同上 |
| B&H / Adorama / eBay 第三方图 | **高**,受版权保护 | 仅作内部参考,**禁止上架** |
| Wikipedia / Wikimedia Commons | 低,注明出处即可 | 临时替代方案 |
| 自拍 / 实物拍摄 | 零 | **最推荐**:BD 拿到实物后自己拍 |

PRD §6.1.3 提到"挂商品链接 / 种草笔记"模式 → SKU 详情页必须要有可靠商品图,**强烈建议走"自己拍实物图 + 官方授权"的混合方案**。

## 四、策略选项(需用户拍板)

### 方案 A · 纯官方抓取(最快但风险高)
1. 用 wget/curl 从 kodak.com / fujifilm.com / ilfordphoto.com / cinestillfilm.com 抓封面
2. 落盘到 `assets/covers/`
3. 风险:可能被投诉下架

### 方案 B · 官方图 + 自拍(推荐)
1. 官方图作为占位快速上线
2. BD 拿到实物后由内部设计 / 用户自己拍摄实物
3. 切到自拍图为主,官方图为辅
4. 风险最低,合规友好

### 方案 C · 接入品牌方白名单(最合规但最慢)
1. 与 Kodak Alaris / 富士胶片(中国)签商务合作
2. 申请正式商品图素材包(含版权链)
3. 风险:周期长,需资质审核

## 五、分级交付建议

| 阶段 | 工作 | Owner |
|---|---|---|
| 立即(W3 前) | 整理 30 个 SKU 的官方 URL 清单(本调研可做) | 调研 agent |
| W3-W4 | 由非只读代理或 BD 抓取并落盘 | 后端 |
| W5 | 上传至 COS(参见 `technical/README.md:91-93`) | 后端 |
| W6-W7 | BD 收实物 → 自拍图替代官方图 | BD + 设计 |
| 上线前 | 与品牌方签商务素材授权协议 | 商务 |

## 六、open questions(待你拍板)

1. 走 A / B / C 哪个方案?
2. 如果选 B,实物拍摄预算大概多少?(决定能不能雇摄影师)
3. 是否需要先抓 10-20 个主推 SKU 的占位图(临时方案 A 形式)撑到 W5?
