import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sharp = require('C:/Program Files (x86)/极速图片压缩器/resources/app/node_modules/sharp')

const root = process.cwd()
const source = path.join(root, 'dist-pack')
const target = path.join(root, 'dist-25mb')

const imageRules = [
  ['design-assets/renders/效果预览图.png', 1180, 55],
  ['design-assets/renders/封面渲染图.png', 1180, 55],
  ['design-assets/renders/compare图1.png', 900, 55],
  ['design-assets/renders/compare图2.png', 900, 55],
  ['design-assets/renders/luxury-specs.png', 1200, 70],
  ['design-assets/ui/纸板纹理.png', 720, 34],
  ['design-assets/ui/首页背景图.png', 1100, 45],
  ['design-assets/ui/首页背景图2.png', 900, 45],
  ['design-assets/ui/背景图1.png', 900, 45],
  ['design-assets/ui/背景图2.png', 900, 45],
  ['design-assets/ui/背景图3.png', 900, 45],
  ['design-assets/ui/介绍框.png', 900, 45],
]

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(resolved))
    else files.push(resolved)
  }
  return files
}

await fs.rm(target, { recursive: true, force: true })
await fs.cp(source, target, { recursive: true })

const replacements = new Map()

for (const [relative, width, quality] of imageRules) {
  const input = path.join(target, ...relative.split('/'))
  if (!await exists(input)) continue

  const outputRelative = relative.replace(/\.png$/i, '.webp')
  const output = path.join(target, ...outputRelative.split('/'))

  await sharp(input)
    .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 6, smartSubsample: true })
    .toFile(output)

  await fs.rm(input, { force: true })
  replacements.set(relative, outputRelative)
  replacements.set(`/${relative}`, `/${outputRelative}`)
  replacements.set(path.basename(relative), path.basename(outputRelative))
}

await fs.rm(path.join(target, 'design-assets/fonts/字魂意笔古典楷(商用需授权).ttf'), { force: true })
await fs.rm(path.join(target, 'design-assets/fonts/OdorMeanChey-Regular.ttf'), { force: true })

const textFiles = (await listFiles(target)).filter((file) => /\.(js|css|html)$/i.test(file))
for (const file of textFiles) {
  let content = await fs.readFile(file, 'utf8')
  for (const [from, to] of replacements) {
    content = content.split(from).join(to)
    content = content.split(encodeURI(from)).join(encodeURI(to))
  }
  await fs.writeFile(file, content)
}

let total = 0
for (const file of await listFiles(target)) {
  total += (await fs.stat(file)).size
}

console.log(`Created ${target}`)
console.log(`Raw size: ${(total / 1024 / 1024).toFixed(2)} MB`)
