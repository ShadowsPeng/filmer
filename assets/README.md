# assets/

胶片封面图、商品图、KOL 头像等静态资源。

## covers/

胶片 SKU 封面图。Phase 1a-α 上线前由 BD 拍实物图替换。
抓取脚本:`scripts/fetch-film-covers.mjs`
来源说明:见 `docs/film-covers-strategy.md`

## subdirs

- `covers/<brand>/<sku>.jpg` — 胶片商品图
- `avatars/` — 用户头像(Phase 0a 接入后)
- `posts/` — Feed 笔记配图
- `icons/` — 通用图标

## 注意

- .gitignore 已忽略本目录所有实际图片(避免大文件污染 git)
- 生产环境走腾讯云 COS + CDN(见 `technical/README.md`)
- 商用前必须确认版权(详见 `docs/film-covers-strategy.md`)
