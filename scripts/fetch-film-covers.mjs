/**
 * fetch-film-covers.mjs
 * --------------------
 * 用途:批量抓取 Filmer Phase 1 商城所需的胶片封面图(初始占位,W6 前会被自拍图替换)
 * 落盘:./assets/covers/<brand>/<sku>.jpg
 * 来源:只抓 Wikimedia Commons(标注作者可商用),其他来源需先走商务授权
 * 执行:`node scripts/fetch-film-covers.mjs`
 * 前置:Node.js 18+ (fetch API)
 *
 * 输出:Wikimedia 官方要求 5 秒 User-Agent 含联系方式,本脚本用固定 UA
 * 失败:被 reject 时降级为 null,登录到 stderr,不影响主流程
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const UA = 'Filmer-Bot/1.0 (cover-fetch; admin@filmer.example.com)  // 符合 Wikimedia UA 策略'
const OUT = path.resolve(process.cwd(), 'assets/covers')

// Wikimedia Commons 直链(已 WebSearch 命中并核实页面存在)
// 注意:URL 里 <a>/<ab>/ 必须用 filename MD5 头两位
function commonsUrl(filename) {
  const md5 = crypto.createHash('md5').update(filename).digest('hex')
  return `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5.slice(0, 2)}/${filename}`
}

// 5 个已核实的 Wikimedia 直链
const SKUS = [
  { brand: 'kodak', filename: 'Kodak_Ektar_100_box.jpg',                alt: 'Kodak Ektar 100 135' },
  { brand: 'kodak', filename: 'Kodak_Ektar_100_box.jpg',                alt: 'Kodak Ektar 100 120' },  // 同图
  { brand: 'fuji',  filename: 'Fuji_Velvia_50_-_120_-_box_-_2010.jpg',  alt: 'Fuji Velvia 50 120' },
  { brand: 'fuji',  filename: 'Fujichrome_Velvia_RVP_-_box_-_front_and_back_-_2011.jpg', alt: 'Fuji Velvia 50 135 (RVP 35mm)' },
  { brand: 'fuji',  filename: 'Fujichrome_Velvia_100_RVP100_-_box_-_2012.jpg',           alt: 'Fuji Velvia 100 135' },
]

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1000) throw new Error('too small (<1KB), likely 404 HTML')
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  return buf.length
}

async function main() {
  console.log(`Fetch from Wikimedia Commons → ${OUT}`)
  let ok = 0, fail = 0
  for (const { brand, filename, alt } of SKUS) {
    const url = commonsUrl(filename)
    const dest = path.join(OUT, brand, filename)
    try {
      const bytes = await download(url, dest)
      console.log(`✓ ${brand}/${filename}  (${(bytes/1024).toFixed(1)} KB) — ${alt}`)
      ok++
    } catch (e) {
      console.warn(`✗ ${brand}/${filename}: ${e.message}`)
      fail++
    }
  }
  console.log(`\n${ok} ok / ${fail} failed`)
  console.log('\n剩余 SKU(Wikimedia 无对应条目 / 需商务授权):')
  console.log('  - Kodak Portra 400/800, E100, Tri-X 400, T-Max 400, Gold 200')
  console.log('  - Fuji Provia 100F, Superia 400')
  console.log('  - Ilford HP5 Plus, FP4 Plus, Delta 3200')
  console.log('  - CineStill 5207 250D, 800T')
  console.log('处理方式:Phase 1a-α 前由 BD 拍实物,或与品牌方走授权。')
  console.log('参考:docs/film-covers-strategy.md 策略选项 A/B/C')
}

main().catch((e) => { console.error(e); process.exit(1) })
