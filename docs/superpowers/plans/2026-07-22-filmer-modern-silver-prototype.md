# Filmer Modern Silver Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将全部现有 HTML 高保真屏幕统一为已批准的现代银盐设计，并优先改善导航、发布、内容到服务的连接、交易信任和可访问性。

**Architecture:** 保留 `prototype-v2.html` 和四个 iframe 模块。新增一个共享 CSS 和一个共享 JS，通过少量 HTML 标记和共享增强覆盖全部页面；模块文件只处理专属信息层级。测试使用 Node 内置测试，不新增依赖。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、Node.js `node:test`。

---

### Task 1: Add failing prototype contract tests

**Files:**
- Create: `technical/tests/prototype-ui.test.mjs`
- Test: `technical/tests/prototype-ui.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const shell = await readFile(new URL('technical/prototype-v2.html', root), 'utf8');
const modules = ['feed', 'rental', 'shop', 'profile'];
const pages = await Promise.all(modules.map(async name => ({
  name,
  html: await readFile(new URL(`technical/tabs/${name}.html`, root), 'utf8'),
})));

test('all prototype documents load the shared modern-silver assets', () => {
  for (const html of [shell, ...pages.map(page => page.html)]) {
    assert.match(html, /filmer-v3\.css/);
    assert.match(html, /filmer-v3\.js/);
  }
});

test('shell exposes five navigation slots with a labeled publish action', () => {
  for (const label of ['发现', '租赁', '发卷', '商城', '我的']) assert.match(shell, new RegExp(label));
  assert.doesNotMatch(shell, /class="fab"/);
});

test('feed publish flow exposes three explicit stages and one final action', () => {
  const feed = pages.find(page => page.name === 'feed').html;
  assert.equal((feed.match(/data-publish-stage=/g) || []).length, 3);
  assert.equal((feed.match(/data-final-publish/g) || []).length, 1);
});

test('transaction screens expose trust and film-spec information', () => {
  const rental = pages.find(page => page.name === 'rental').html;
  const shop = pages.find(page => page.name === 'shop').html;
  assert.match(rental, /data-rental-trust/);
  assert.match(shop, /data-film-specs/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test technical/tests/prototype-ui.test.mjs`

Expected: FAIL because shared assets, five-slot navigation, publish stages, trust strip and film specs do not exist.

- [ ] **Step 3: Keep the failing test as the contract**

Do not weaken selectors during implementation. Each assertion represents an approved design requirement.

### Task 2: Add the shared modern-silver system

**Files:**
- Create: `technical/shared/filmer-v3.css`
- Create: `technical/shared/filmer-v3.js`
- Modify: `technical/prototype-v2.html`
- Modify: `technical/tabs/feed.html`
- Modify: `technical/tabs/rental.html`
- Modify: `technical/tabs/shop.html`
- Modify: `technical/tabs/profile.html`

- [ ] **Step 1: Add the shared token and accessibility layer**

Create CSS tokens and minimum interaction rules:

```css
:root {
  --primary: #171512;
  --bg-darker: #100f0d;
  --card: #201d19;
  --paper: #f5f0e8;
  --text-light: #b8aea0;
  --brass: #d0ad6a;
  --brass-light: #dec38f;
  --brass-dark: #a9854d;
  --kodak: #c65b32;
  --divider: #403930;
  --success: #7f9b6c;
  --radius: 6px;
}

body { color: var(--paper); font-size: 14px; }
button, a, [role="button"], input, textarea, select { min-height: 44px; }
.muted, small, time, .meta, .sub, .desc, .label { font-size: max(12px, 0.75rem); }
:focus-visible { outline: 2px solid var(--brass); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
```

Create JS that makes existing `onclick` elements keyboard-operable and supplies an accessible fallback name:

```js
function enhancePrototypeSemantics(root = document) {
  root.querySelectorAll('[onclick]:not(button):not(a)').forEach(element => {
    element.setAttribute('role', 'button');
    if (!element.hasAttribute('tabindex')) element.tabIndex = 0;
    if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
      element.setAttribute('aria-label', element.title || '操作');
    }
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        element.click();
      }
    });
  });
}
document.addEventListener('DOMContentLoaded', () => enhancePrototypeSemantics());
```

- [ ] **Step 2: Load assets after each document's legacy CSS**

Shell uses `shared/filmer-v3.css` and `shared/filmer-v3.js`; tab documents use `../shared/filmer-v3.css` and `../shared/filmer-v3.js`.

- [ ] **Step 3: Run tests**

Run: `node --test technical/tests/prototype-ui.test.mjs`

Expected: the shared asset test passes; feature-specific tests remain red.

### Task 3: Replace the floating action with five-slot navigation

**Files:**
- Modify: `technical/prototype-v2.html`
- Modify: `technical/shared/filmer-v3.css`

- [ ] **Step 1: Replace the shell navigation markup**

Use one semantic button per slot and a central labeled publish action:

```html
<nav class="tab-bar" aria-label="主导航">
  <button class="tab-item active" data-tab="feed" onclick="openTab('feed')"><span class="tab-glyph" aria-hidden="true">⌂</span><span class="tab-label">发现</span></button>
  <button class="tab-item" data-tab="rental" onclick="openTab('rental')"><span class="tab-glyph" aria-hidden="true">▣</span><span class="tab-label">租赁</span></button>
  <button class="tab-item publish-tab" onclick="openPublish()" aria-label="发卷"><span class="publish-mark">＋</span><span class="tab-label">发卷</span></button>
  <button class="tab-item" data-tab="shop" onclick="openTab('shop')"><span class="tab-glyph" aria-hidden="true">▤</span><span class="tab-label">商城</span></button>
  <button class="tab-item" data-tab="profile" onclick="openTab('profile')"><span class="tab-glyph" aria-hidden="true">○</span><span class="tab-label">我的</span></button>
</nav>
```

- [ ] **Step 2: Remove `.fab` markup and style the central action**

```css
.tab-bar { height: 72px; padding-bottom: max(8px, env(safe-area-inset-bottom)); }
.tab-item { border: 0; background: transparent; color: var(--text-light); }
.publish-tab { transform: translateY(-11px); color: var(--brass); }
.publish-mark { width: 48px; height: 48px; border-radius: 50%; background: var(--brass); color: var(--primary); display: grid; place-items: center; font-size: 24px; }
```

- [ ] **Step 3: Run tests**

Run: `node --test technical/tests/prototype-ui.test.mjs`

Expected: navigation test passes.

### Task 4: Restructure feed and publish hierarchy

**Files:**
- Modify: `technical/tabs/feed.html`
- Modify: `technical/shared/filmer-v3.css`

- [ ] **Step 1: Mark the three publish stages and unique final action**

Add `data-publish-stage="photos"`, `data-publish-stage="details"`, and `data-publish-stage="share"` to the three sections. Add `data-final-publish` only to the bottom publish button and turn the top-right label into a non-submitting draft status.

- [ ] **Step 2: Add a visible progress header**

```html
<div class="publish-progress" aria-label="发布进度">
  <span class="is-active">1 照片</span><span>2 胶片信息</span><span>3 发布</span>
</div>
```

- [ ] **Step 3: Reduce feed card density with shared overrides**

```css
body[data-module="feed"] .banner { height: 84px; }
body[data-module="feed"] .card { border-radius: 8px; }
body[data-module="feed"] .card .meta { display: none; }
body[data-module="feed"] .card .actions span:nth-child(n+3) { display: none; }
.publish-progress { display: grid; grid-template-columns: repeat(3,1fr); padding: 12px 16px; color: var(--text-light); font-size: 12px; }
.publish-progress .is-active { color: var(--brass); }
```

- [ ] **Step 4: Run tests**

Run: `node --test technical/tests/prototype-ui.test.mjs`

Expected: publish flow test passes.

### Task 5: Add rental trust and shop film-spec information

**Files:**
- Modify: `technical/tabs/rental.html`
- Modify: `technical/tabs/shop.html`
- Modify: `technical/shared/filmer-v3.css`

- [ ] **Step 1: Add the rental trust strip to camera detail**

```html
<section class="trust-strip" data-rental-trust aria-label="租赁保障">
  <span><b>可租</b> 7月24日起</span>
  <span><b>押金</b> ¥6,000</span>
  <span><b>保障</b> 含验机报告</span>
</section>
```

- [ ] **Step 2: Add film specifications to product detail**

```html
<section class="film-specs" data-film-specs aria-label="胶卷规格">
  <span><b>ISO</b> 400</span>
  <span><b>画幅</b> 135 / 120</span>
  <span><b>工艺</b> C-41</span>
  <span><b>保存</b> 冷藏</span>
</section>
```

- [ ] **Step 3: Style both as readable information grids**

```css
.trust-strip, .film-specs { margin: 12px 14px; padding: 12px; display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; background: var(--card); border: 1px solid var(--divider); border-radius: 8px; }
.trust-strip span, .film-specs span { color: var(--text-light); font-size: 12px; }
.trust-strip b, .film-specs b { color: var(--paper); display: block; margin-bottom: 3px; }
```

- [ ] **Step 4: Run tests**

Run: `node --test technical/tests/prototype-ui.test.mjs`

Expected: transaction information test passes.

### Task 6: Finish all-screen consistency and verification

**Files:**
- Modify: `technical/tabs/profile.html`
- Modify: `technical/shared/filmer-v3.css`
- Modify: `technical/shared/filmer-v3.js`
- Test: `technical/tests/prototype-ui.test.mjs`

- [ ] **Step 1: Mark every module body**

Use `data-module="shell|feed|rental|shop|profile"` so shared CSS can apply bounded module overrides.

- [ ] **Step 2: Normalize common components**

```css
.topbar { min-height: 58px; padding-inline: 16px; background: color-mix(in srgb, var(--primary) 94%, transparent); }
.btn-primary, .btn-brass, .publish-button { min-height: 44px; background: var(--brass); color: var(--primary); border-radius: 6px; }
.chip, .spec, .tab { min-height: 36px; display: inline-flex; align-items: center; }
.screen { padding-bottom: max(28px, env(safe-area-inset-bottom)); }
```

- [ ] **Step 3: Run the complete suite**

Run: `node --test technical/tests/prototype-ui.test.mjs`

Expected: PASS with no failures.

- [ ] **Step 4: Perform static quality checks**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 5: Inspect the six core views at 375×812**

Verify discovery, rental, shop, profile, detail and publish screens have no horizontal overflow, overlap, unreadable secondary text or bottom-safe-area collision.
