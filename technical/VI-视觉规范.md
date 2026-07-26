# Filmer — VI 视觉规范

> 文档版本：v1.1（复古胶片风格确认）
> 日期：2026-07-20

---

## 1. 品牌概述

**Filmer** — 拍胶片的人。

品牌精神：暗房、颗粒、光晕、慢拍。每一卷都是限量版，每一张都有温度。

**视觉风格关键词：** 复古胶片感、暖色调、暗房氛围、银盐质感、做旧纹理

---

## 2. 品牌色（v1.1 — 暖色调复古版）

| 用途          | 色值        | 色名      | 说明                 |
| ----------- | --------- | ------- | ------------------ |
| **主色**      | `#141210` | 胶片黑（暖调） | 暖黑色，非冷黑，暗房氛围更浓     |
| **底色**      | `#1E1B17` | 卡片底     | 略浅于主色，区分层次         |
| **辅色**      | `#EDE5D8` | 银盐白     | 暖白相纸色，比纯白更有质感      |
| **强调色**     | `#C9A96E` | 黄铜色     | 哈苏/徕卡/ Kodak 品牌常用色 |
| **Kodak 红** | `#C25B2B` | Kodak 红 | 复古 Kodak 色，比标准红更暖  |
| **文字-深**    | `#2C2C2C` | 正文      | 深色文字，高对比           |
| **文字-浅**    | `#9A9080` | 辅助      | 旧银盐色调，次要信息         |
| **暖色调**     | `#D4A574` | 暖调      | 胶片特有暖色倾向           |
| **分割线**     | `#3A3530` | 分隔      | 复古深棕色分隔线           |

### 2.1 色彩应用示例

```
背景：#141210（暖黑主背景）
卡片：#1E1B17（内容卡片）
文字：#EDE5D8（银盐白主要文字）
强调：#C9A96E（黄铜色标签/图标高亮）
警示：#C25B2B（Kodak 红）
次要文字：#9A9080（旧银盐色调）
```

---

## 3. 视觉风格细则

### 3.1 做旧质感（关键特征）

| 效果        | 实现方式                                   |
| --------- | -------------------------------------- |
| **胶片颗粒**  | 全屏叠加 SVG feTurbulence 噪点纹理，opacity 0.4 |
| **暗角压边**  | 页面边缘 radial-gradient 渐暗，模拟镜头暗角         |
| **齿孔边框**  | 左右两侧保留 135 胶片齿孔装饰（每侧 15 个 sprocket）    |
| **暖色调倾向** | 所有颜色偏暖，主色禁用冷黑色                         |
| **圆角收紧**  | 圆角 2-3px（复古卡片），禁用大圆角                   |
| **金属光泽**  | 按钮/标签加 linear-gradient 高光模拟金属质感        |

### 3.2 胶片文化装饰元素

- 图片帧号：`#012` 格式，右下角显示
- 卡片顶边：黄铜色细线（模拟片孔标记）
- 胶片卷装饰条：铜色齿轮图案 + 品牌标语
- Vintage Banner：仿 Kodak 胶卷包装风格

---

## 4. 字体

| 用途          | 字体                    | 字重          | 说明                     |
| ----------- | --------------------- | ----------- | ---------------------- |
| **品牌标题**    | Playfair Display      | 700         | 衬线体，复古高级感，品牌 Logo 和大标题 |
| **中文正文**    | Source Han Sans（思源黑体） | 400/500     | 干净无衬线，正文和 UI           |
| **英文正文/数字** | Inter                 | 400/500/600 | 现代可读，用于数字和辅助英文         |
| **标签/帧号**   | Inter                 | 600         | 高亮数字、统计数据、帧号标记         |

**字体加载（Web / 小程序）：**

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&family=Noto+Sans+SC:wght@400;500&display=swap');

font-family: 'Noto Sans SC', 'PingFang SC', sans-serif;      /* 中文 */
font-family: 'Inter', 'SF Pro Text', sans-serif;              /* 英文/数字 */
font-family: 'Playfair Display', 'Georgia', serif;            /* 品牌标题 */
```

---

## 5. 图标规范

| 属性  | 规范                                           |
| --- | -------------------------------------------- |
| 类型  | 线性图标（stroke-based）                           |
| 粗细  | stroke 1.5px                                 |
| 颜色  | #EDE5D8（默认）/ #C9A96E（激活状态）                   |
| 圆角  | stroke-linecap: round，stroke-linejoin: round |
| 尺寸  | 24×24px（标准）/ 20×20px（紧凑）/ 32×32px（突出）        |

---

## 6. 组件规范

### 6.1 卡片（内容卡片）

```css
background: #1E1B17;
border-radius: 3px;              /* 圆角收紧，复古感 */
box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3);
border: 1px solid rgba(255,255,255,0.04);
```

### 6.2 按钮

**主按钮：**

```css
background: linear-gradient(180deg, #D4B578 0%, #C9A96E 50%, #B8944F 100%);
/* 金属光泽，模拟黄铜质感 */
color: #1A1208;
border-radius: 3px;
box-shadow: 0 2px 12px rgba(201,169,110,0.25), inset 0 1px 0 rgba(255,255,255,0.15);
```

**次要按钮：**

```css
background: transparent;
border: 1px solid #3A3530;
color: #EDE5D8;
border-radius: 3px;
box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
```

**危险按钮：**

```css
background: linear-gradient(180deg, #D06A3A 0%, #C25B2B 100%);
color: #FFF5E8;
border-radius: 3px;
box-shadow: 0 2px 12px rgba(194,91,43,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
```

### 6.3 输入框

```css
background: rgba(30,27,23,0.8);
border: 1px solid #3A3530;
border-radius: 3px;
color: #EDE5D8;
padding: 12px 14px;
box-shadow: inset 0 2px 6px rgba(0,0,0,0.3);
```

聚焦时：`border-color: #C9A96E; box-shadow: 0 0 0 2px rgba(201,169,110,0.1);`

### 6.4 标签（胶片信息卡）

```css
background: rgba(201,169,110,0.08);
color: #C9A96E;
border: 1px solid rgba(201,169,110,0.2);
border-radius: 2px;
padding: 2px 8px;
font-size: 10px;
font-family: 'Inter', sans-serif;
letter-spacing: 0.3px;
```

---

## 7. 页面布局规范

### 7.1 间距系统

| 名称  | 数值   | 用途         |
| --- | ---- | ---------- |
| xs  | 4px  | 紧凑元素内部间距   |
| sm  | 8px  | 小间距，标签内间距  |
| md  | 14px | 标准间距，卡片内间距 |
| lg  | 24px | 模块之间间距     |
| xl  | 32px | 大区块间距      |
| xxl | 48px | 页面级留白      |

### 7.2 安全区

- iOS 顶部：44px（刘海屏）~ 20px（非刘海）
- iOS 底部：34px（Home Indicator）
- Android 底部导航：48-56px（视机型而定）
- 小程序状态栏：自动适配

---

## 8. 首页布局示意

```
┌─────────────────────────────────────────┐
│ ▌                                      ▐ │  ← 胶片齿孔边框
│ ▌  ▼ FILMER®              [🔔] [👤]    ▐ │  ← 顶栏：暖黑底，黄铜色图标
│ ▌─────────────────────────────────────── ▐ │
│ ▌  EVERY ROLL IS LIMITED · FILM NEVER DIES│  ← Vintage Banner
│ ▌                                      ▐ │
│ ▌  #今日冲洗  #反转片挑战  #哈苏收藏  ...  ▐ │  ← 话题标签，紧凑圆角
│ ▌                                      ▐ │
│ ▌  ┌─────────────────────────────┐    ▐ │
│ ▌  │═════════════════════════════│    ▐ │  ← 卡片顶边：黄铜色细线
│ ▌  │                             │    ▐ │
│ ▌  │      📷  PORTRA             │    ▐ │  ← 图片区，右下角帧号 #012
│ ▌  │                    #012     │    ▐ │
│ ▌  │─────────────────────────────│    ▐ │
│ ▌  │ Kodak Portra 400  135·C-41  │    ▐ │  ← 胶片信息卡标签
│ ▌  │ 徕卡 M6·映画馆冲扫·2026.07  │    ▐ │
│ ▌  │ ♡ 1.2k    💬 89      ↗      │    ▐ │
│ ▌  └─────────────────────────────┘    ▐ │
│ ▌                                      ▐ │
│ ▌  ┌────┐                              ▐ │
│ ▌  │ ◉◉ │ PORTRA 400                  ▐ │  ← 胶片卷装饰条
│ ▌  │    │ THE WORLD'S MOST POPULAR     ▐ │
│ ▌  └────┘                             ▐ │
│ ▌─────────────────────────────────────── ▐ │
│ ▌     [🏠]   [📷]   [📦]   [👤]        ▐ │  ← Tab：黄铜色激活
└─────────────────────────────────────────┘
```

**底部 Tab 栏（4个）：**

| Tab | 图标   | 名称  | 含义         |
| --- | ---- | --- | ---------- |
| 首页  | 房子图标 | 发现  | 内容 Feed    |
| 拍摄  | 相机图标 | 记录  | 发布笔记（核心操作） |
| 租赁  | 盒子图标 | 租赁  | 相机/胶卷租赁    |
| 我的  | 用户图标 | 个人  | 个人中心       |

---

## 9. 深色模式说明

> Filmer 默认深色模式，模拟暗房氛围，是品牌核心视觉语言。

- **禁用纯白 `#FFFFFF`**（纯白 除非临时弹窗）
- 所有颜色偏暖（暖黑 `#141210`、暖白 `#EDE5D8`）
- 彩色与黑白内容混排时，用卡片背景 `#1E1B17` 隔开层次
- 深色模式优势：图片更突出、OLED 省电、胶片质感强

---

## 10. 品牌资产清单（待制作）

| 资源           | 格式            | 说明                         |
| ------------ | ------------- | -------------------------- |
| Logo（Filmer） | SVG + PNG     | 白色版本 / 深色底版本，衬线字体          |
| App Icon     | 1024×1024 PNG | 复古胶卷包装风格                   |
| 胶片信息卡图标      | SVG           | ISO/光圈/快门等符号               |
| Tab Bar 图标   | SVG（24×24）    | 4个激活态 + 4个默认态              |
| 品牌字体文件       | TTF/OTF       | Playfair Display（购买授权）     |
| 启动屏（Splash）  | PNG           | Filmer Logo + 品牌色背景 + 颗粒纹理 |

---

*本规范为 VI v1.1 版本，风格已确认。VI demo 见 `VI-demo.html`。*

---

## 3. 字体

| 用途        | 字体                    | 字重      | 说明                     |
| --------- | --------------------- | ------- | ---------------------- |
| **品牌标题**  | Playfair Display      | 700     | 衬线体，复古高级感，用于 Logo 和大标题 |
| **中文正文**  | Source Han Sans（思源黑体） | 400/500 | 干净无衬线，正文和 UI           |
| **英文正文**  | Inter                 | 400/500 | 现代可读，用于数字和辅助英文         |
| **数字/标签** | Inter                 | 600     | 高亮数字、统计数据              |

**字体加载（Web / 小程序）：**

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&family=Noto+Sans+SC:wght@400;500&display=swap');

font-family: 'Noto Sans SC', 'PingFang SC', sans-serif;      /* 中文 */
font-family: 'Inter', 'SF Pro Text', sans-serif;              /* 英文/数字 */
font-family: 'Playfair Display', 'Georgia', serif;            /* 品牌标题 */
```

---

## 4. 图标规范

| 属性  | 规范                                           |
| --- | -------------------------------------------- |
| 类型  | 线性图标（stroke-based）                           |
| 粗细  | stroke 1.5px                                 |
| 颜色  | #F5F0E8（默认）/ #C9A96E（激活状态）                   |
| 圆角  | stroke-linecap: round，stroke-linejoin: round |
| 尺寸  | 24×24px（标准）/ 20×20px（紧凑）/ 32×32px（突出）        |

---

## 5. 组件规范

### 5.1 卡片（内容卡片）

```css
background: #242424;
border-radius: 12px;
padding: 16px;
box-shadow: 0 2px 8px rgba(0,0,0,0.3);
margin-bottom: 12px;
```

### 5.2 按钮

**主按钮：**

```css
background: #C9A96E;    /* 黄铜色 */
color: #1A1A1A;
border-radius: 8px;
height: 44px;
font-weight: 600;
```

**次要按钮：**

```css
background: transparent;
border: 1.5px solid #3A3A3A;
color: #F5F0E8;
border-radius: 8px;
height: 44px;
```

**危险按钮：**

```css
background: #D4442B;
color: #FFFFFF;
border-radius: 8px;
height: 44px;
```

### 5.3 输入框

```css
background: #2A2A2A;
border: 1.5px solid #3A3A3A;
border-radius: 8px;
color: #F5F0E8;
padding: 12px 16px;
font-size: 15px;
```

### 5.4 标签（胶片信息卡）

```css
background: rgba(201, 169, 110, 0.15);
color: #C9A96E;
border: 1px solid #C9A96E;
border-radius: 4px;
padding: 2px 8px;
font-size: 12px;
font-family: 'Inter', sans-serif;
```

---

## 6. 页面布局规范

### 6.1 间距系统

| 名称  | 数值   | 用途         |
| --- | ---- | ---------- |
| xs  | 4px  | 紧凑元素内部间距   |
| sm  | 8px  | 小间距，标签内间距  |
| md  | 16px | 标准间距，卡片内间距 |
| lg  | 24px | 模块之间间距     |
| xl  | 32px | 大区块间距      |
| xxl | 48px | 页面级留白      |

### 6.2 安全区

- iOS 顶部：44px（刘海屏）~ 20px（非刘海）
- iOS 底部：34px（Home Indicator）
- Android 底部导航：48-56px（视机型而定）
- 小程序状态栏：自动适配

---

## 7. 首页布局示意

```
┌─────────────────────────────┐
│  ▼ Filmer           [🔔] [👤] │  ← 顶栏：深色 #1A1A1A，白字Logo，黄铜色图标
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ #今日冲洗  #反转片挑战    │  │  ← 话题标签横向滚动，黄铜色边框激活态
│  └───────────────────────┘  │
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │     │ │     │ │     │   │  ← 瀑布流 Feed，黄铜色胶片信息卡
│  │  📷 │ │  📷 │ │  📷 │   │
│  │     │ │     │ │     │   │
│  └─────┘ └─────┘ └─────┘   │
│  Portra 400   Ektar 100     │  ← 胶片型号标签
│  徕卡 M6 · 映画馆  ♡234 💬18│  ← 辅助信息，#8C8C8C
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  ...（继续瀑布流）        │   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
├─────────────────────────────┤
│  [🏠]  [📷]  [📦]  [👤]    │  ← 底部 Tab：黄铜色激活，银盐白默认
└─────────────────────────────┘
```

**底部 Tab 栏（4个）：**

| Tab | 图标   | 名称  | 含义         |
| --- | ---- | --- | ---------- |
| 首页  | 房子图标 | 发现  | 内容 Feed    |
| 拍摄  | 相机图标 | 记录  | 发布笔记（核心操作） |
| 租赁  | 盒子图标 | 租赁  | 相机/胶卷租赁    |
| 我的  | 用户图标 | 个人  | 个人中心       |

---

## 8. 深色模式说明

> Filmer 默认深色模式，模拟暗房氛围，是品牌核心视觉语言。

- **禁止使用白色背景**（纯白 `#FFFFFF` 除非临时弹窗）
- 所有图片内容保持原片色彩，**平台不加滤镜、不调色**
- 彩色与黑白内容混排时，用卡片背景 `#242424` 隔开层次
- 深色模式优势：图片更突出、OLED 省电、胶片质感强

---

## 9. 品牌资产清单（待制作）

| 资源           | 格式            | 说明                     |
| ------------ | ------------- | ---------------------- |
| Logo（Filmer） | SVG + PNG     | 白色版本 / 深色底版本           |
| App Icon     | 1024×1024 PNG | iOS/Android 双平台        |
| 胶片信息卡图标      | SVG           | ISO/光圈/快门等符号           |
| Tab Bar 图标   | SVG（24×24）    | 4个激活态 + 4个默认态          |
| 品牌字体文件       | TTF/OTF       | Playfair Display（购买授权） |
| 启动屏（Splash）  | PNG           | Filmer Logo + 品牌色背景    |

---

*本规范为 VI 1.0 版本，具体设计稿需设计师按此规范输出后落地。*
