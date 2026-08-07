import { drawFace } from "./drawFace"
import { parseMask } from "./parseMask"

// ウォーターマーク描写
function drawWatermark(ctx, W, H) {
  ctx.save()

  const fontSize = Math.max(10, Math.round(W * 0.05))
  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(50, 30, 10, 0.22)'
  ctx.textAlign = 'left'

  const text = 'sample'
  const tw   = ctx.measureText(text).width + 14
  const th   = fontSize * 2.2

  ctx.translate(W / 2, H / 2)
  ctx.rotate(-Math.PI / 6) // 30度傾け

  const halfD = Math.sqrt(W * W + H * H) / 2 + Math.max(tw, th)
  for (let row = -Math.ceil(halfD / th); row <= Math.ceil(halfD / th); row++) {
    for (let col = -Math.ceil(halfD / tw); col <= Math.ceil(halfD / tw); col++) {
      ctx.fillText(text, col * tw, row * th)
    }
  }

  ctx.restore()
}

// 外枠描写（角丸四角形のパス）
function roundRect(ctx, x, y, w, h, r) {
  // パス開始 ※図形描写開始
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  // 上辺描写
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  // 右編描写
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  // 下辺描写
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  // 左辺描写
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  // パス終了
  ctx.closePath()
}

// 画像を非同期ロード
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// テキストを行ごとに分割
function splitLines(ctx, text, maxW) {
  const lines = []
  const words = []
  const raw = text.split(' ')
  let i = 0
  while (i < raw.length) {
    if (raw[i].length === 1 && i + 1 < raw.length) {
      words.push(raw[i] + ' ' + raw[i + 1])
      i += 2
    } else {
      words.push(raw[i])
      i++
    }
  }
  let line = ''
  for (const word of words) {
    const wordW = ctx.measureText(word).width
    if (wordW > maxW) {
      if (line) { lines.push(line); line = '' }
      const numLines = Math.round(wordW / (maxW * 0.7))
      const targetW = wordW / numLines
      let cur = ''
      for (const char of [...word]) {
        const test = cur + char
        if (ctx.measureText(test).width > targetW && cur.length > 0) {
          lines.push(cur)
          cur = char
        } else {
          cur = test
        }
      }
      if (cur) lines.push(cur)
      line = ''
    } else {
      const test = line ? line + ' ' + word : word
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
  }
  if (line) lines.push(line)

  // 2文字以下の行を前の行に吸収
  for (let i = lines.length - 1; i >= 1; i--) {
    if ([...lines[i]].length <= 2) {
      lines[i - 1] += lines[i]
      lines.splice(i, 1)
    }
  }
  return lines
}

// 見開き描写
export async function drawSpread(canvas, spread, face, faceParts, isPreview) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  ctx.clearRect(0, 0, W, H)

  // 表紙判定
  const isCover = spread?.sp_num === 0

  // イラストをマスクを読み込み
  const img = spread?.img
  const maskPath = img?.img_path?.replace(/(\.[^.]+)$/, '_mask.png')
  const maskUrl = import.meta.env.DEV ? `${maskPath}?t=${Date.now()}` : maskPath
  const [bgImg, maskImg] = await Promise.all([
    // 見開き1面に対して1イラストなので左ページから取得
    img?.img_path ? loadImage(img.img_path) : Promise.resolve(null),
    maskPath  ? loadImage(maskUrl)  : Promise.resolve(null),
  ])

  // マスク解析
  const mask = maskImg ? parseMask(maskImg) : null

  // 背景
  ctx.fillStyle = '#FFFBF0'
  ctx.fillRect(0, 0, W, H)

  if (bgImg) {
    const cov = mask?.covArea
    let destX = 0, destY = 0, destW = W, destH = H

    // 背景画像描写
    if (isCover && cov) {
      // 表紙
      const iW = bgImg.naturalWidth
      const iH = bgImg.naturalHeight
      const cropW = cov.w * iW
      const cropH = cov.h * iH
      // canvas内に収まるスケール（比率維持）
      const scale = Math.min(W / cropW, H / cropH)
      destW = cropW * scale
      destH = cropH * scale
      destX = (W - destW) / 2
      destY = (H - destH) / 2
      ctx.drawImage(bgImg, cov.x * iW, cov.y * iH, cropW, cropH, destX, destY, destW, destH)
    } else {
      // 表紙以外
      ctx.drawImage(bgImg, 0, 0, W, H)
    }

    // 顔パーツ描写
    if (mask?.face) {
      const cx = isCover && cov ? ((mask.face.cx - cov.x) / cov.w) * destW + destX : mask.face.cx * W
      const cy = isCover && cov ? ((mask.face.cy - cov.y) / cov.h) * destH + destY : mask.face.cy * H
      const scale = isCover ? W / 720 * 2 : W / 720
      await drawFace(ctx, cx, cy, img.size * scale, face, faceParts, img.ox * scale, img.tilt, img.angle)
    }
  }

  // テキスト
  const font = 'Zen Maru Gothic, sans-serif'
  const fontColor = '#3D2B1F'
  await document.fonts.ready
  if (isCover && spread?.text1) {
    // 表紙
    ctx.save()
    let fontSize = H * 0.06
    ctx.font = `bold ${fontSize}px ${font}`
    ctx.textAlign = 'center'
    while (ctx.measureText(spread.text1).width > W * 0.80 && fontSize > H * 0.03) {
      fontSize -= 1
      ctx.font = `bold ${fontSize}px ${font}`
    }
    // 白縁
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = fontSize * 0.3
    ctx.lineJoin = 'round'
    ctx.strokeText(spread.text1, W / 2, H * 0.20)
    // 黒字
    ctx.fillStyle = fontColor
    ctx.fillText(spread.text1, W / 2, H * 0.20)
    ctx.restore()

  } else if (mask?.txtArea?.length > 0) {
    // 表紙以外
    const fontSize = H * 0.03
    const lineH = fontSize * 1.5
    ctx.font = `bold ${fontSize}px ${font}`
    ctx.textAlign = 'center'

    mask.txtArea.forEach((zone, i) => {
      const text = i === 0 ? spread?.text1 : spread?.text2
      if (!text) return
      const zoneW = zone.w * W
      const lines = splitLines(ctx, text, zoneW)
      const x = zone.x * W
      const y = zone.y * H + (zone.h * H - lines.length * lineH) / 2
      const zoneH = lines.length * lineH

      // 半透明領域
      const pad = 8
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      const actualW = Math.max(...lines.map(l => ctx.measureText(l).width))
      const rectX = x + zoneW / 2 - actualW / 2 - pad
      const rectW = actualW + pad * 2
      roundRect(ctx, rectX, y - fontSize - pad, rectW, zoneH + pad * 2, 6)
      ctx.fill()

      // テキスト
      ctx.fillStyle = fontColor
      lines.forEach((line, j) => {
        ctx.fillText(line, x + zoneW / 2, y + j * lineH)
      })
    })
  }

  // 外枠 ※太線を内側8pxに配置
  if (isPreview) {
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.35)'
    ctx.lineWidth = 8
    roundRect(ctx, 8, 8, W - 16, H - 16, 6)
    ctx.stroke()
    // 内枠 ※細線を内側18pxに配置
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.15)'
    ctx.lineWidth = 2
    roundRect(ctx, 18, 18, W - 36, H - 36, 4)
    ctx.stroke()
  }

  // ウォーターマーク設定
  if (isPreview) drawWatermark(ctx, W, H)
}
