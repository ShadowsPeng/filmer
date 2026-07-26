# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-07-22
- Primary product surfaces: 微信小程序优先的高保真 HTML 原型，后续兼容 App。
- Evidence reviewed: `product/PRD-Filmer-MVP.md`、`technical/VI-视觉规范.md`、`technical/prototype-v2.html`、`technical/tabs/*.html`、`technical/screenshots/*.png`。

## Brand

- Personality: 现代银盐、克制、真实、温暖、专业。
- Trust signals: 真实样片、胶卷与相机参数、冲扫来源、租赁检测和履约信息。
- Avoid: 过量复古装饰、低对比文字、全页面黄铜描边、将胶片感等同于噪点和做旧。

## Product goals

- Goals: 优先提升内容浏览、发卷完成和胶片信息复用效率；用内容自然连接租赁、商城和冲扫。
- Non-goals: 本轮不接后端、真实支付、真实上传，不改变 PRD 的业务范围。
- Success signals: 核心页面任务入口唯一且清晰；发布必填项可理解；交易前能看到价格、押金、保险和状态；全局组件一致。

## Personas and jobs

- Primary personas: 胶片新手、进阶玩家、KOL 创作者、租赁和购买用户。
- User jobs: 找到可信样片与参数、完成第一卷、记录并分享胶片、购买胶卷、租相机、委托冲扫。
- Key contexts of use: 手机单手操作、户外浏览、弱网、上传多张照片、交易决策。

## Information architecture

- Primary navigation: 发现、租赁、发卷、商城、我的五槽底部导航；“发卷”居中且带文字。
- Core routes/screens: 保留现有 31 个高保真原型屏幕和四个业务 iframe 模块。
- Content hierarchy: 内容与样片优先，参数其次，交易入口跟随上下文出现；二级详情页隐藏全局底部导航。

## Design principles

- 银盐来自内容: 通过真实照片、帧号、编辑语言和参数建立胶片感。
- 清晰先于装饰: 正文、价格、状态和主操作必须在真机上快速辨认。
- 一屏一任务: 每个页面只有一个最高优先级主操作。
- 内容连接服务: 胶卷、相机、画幅、冲扫店均可从内容进入对应服务。
- Tradeoffs: 全局采用现代银盐感；暗房编辑感用于排版；胶卷包装感仅用于活动和联名专题。

## Visual language

- Color: 暖黑 `#171512`、卡片 `#201D19`、银盐白 `#F5F0E8`、辅助文字 `#B8AEA0`、黄铜 `#D0AD6A`、Kodak 红 `#C65B32`。
- Typography: Logo、专题标题、胶卷型号使用衬线字体；UI、参数、价格和订单使用无衬线字体。正文不低于 14px，辅助信息不低于 12px。
- Spacing/layout rhythm: 4px 基础单位，常用间距 8/12/16/24px；主要内容左右留白 16px。
- Shape/radius/elevation: 内容卡 6–8px 圆角；表单和标签 4–6px；仅浮层与关键悬浮操作使用阴影。
- Motion: 150–220ms 状态过渡；禁止持续颗粒动画；尊重减少动态偏好。
- Imagery/iconography: 图片优先保持原始比例；图标统一线性风格并附可访问名称。

## Components

- Existing components to reuse: 顶部栏、Feed 卡、标签、按钮、商品卡、订单卡、Toast、底部导航。
- New/changed components: 五槽导航、居中发卷入口、胶片信息卡、租赁信任信息块、发布进度块、状态页面。
- Variants and states: 默认、按下、选中、禁用、加载、空、错误、成功、断网。
- Token/component ownership: 共享样式文件管理令牌和通用组件；各 tab 文件只保留模块专属布局。

## Accessibility

- Target standard: WCAG 2.2 AA 的对比度和可操作性原则。
- Keyboard/focus behavior: 原型保留自然 Tab 顺序和可见焦点；不使用不可聚焦的 `span/div` 代替按钮。
- Contrast/readability: 正文与关键数据达到清晰对比；不以颜色作为唯一状态线索。
- Screen-reader semantics: 图标按钮带 `aria-label`，分段控件暴露选中状态，图片提供语义化替代文本。
- Reduced motion and sensory considerations: 支持 `prefers-reduced-motion`，不使用闪烁或循环动画。

## Responsive behavior

- Supported breakpoints/devices: 主验收 375×812，补充验证 390px 宽度；预留微信顶部胶囊和底部安全区。
- Layout adaptations: 瀑布流在窄屏保持两列但减少卡片信息；表单和详情在横向空间不足时换行。
- Touch/hover differences: 触控区域不低于 44×44px；hover 仅作增强，不能承载必要信息。

## Interaction states

- Loading: 页面骨架、图片占位、上传/支付进度。
- Empty: 解释原因并提供一个明确下一步。
- Error: 就地错误信息、可重试操作和用户可理解文案。
- Success: 状态确认后进入下一任务，不使用只有 Toast 的关键成功反馈。
- Disabled: 同时展示禁用原因，不只降低透明度。
- Offline/slow network: 顶部网络提示、缓存内容和显式重试。

## Content voice

- Tone: 温暖、克制、懂胶片但不卖弄术语。
- Terminology: 用户内容统一称“发卷/一卷”，商品、租赁和冲扫使用直接业务词。
- Microcopy rules: 按钮用动词；错误说明原因和下一步；关键交易金额不使用模糊缩写。

## Implementation constraints

- Framework/styling system: 保留 `prototype-v2.html + technical/tabs/*.html` iframe 结构，新增共享 CSS/JS，不做框架迁移。
- Design-token constraints: 新增令牌覆盖旧样式，逐步删除冲突的页面级硬编码。
- Performance constraints: 不新增大型依赖；装饰纹理必须低成本且不阻塞首屏。
- Compatibility constraints: 微信小程序优先，原型同时模拟 App 安全区。
- Test/screenshot expectations: 静态自动化检查设计系统接入、导航、字号、触控和语义；核心页面生成 375×812 视觉截图。

## Open questions

- 当前批准范围没有阻塞性开放问题；真实照片素材和交易数据在进入开发阶段后由内容与业务团队提供。
