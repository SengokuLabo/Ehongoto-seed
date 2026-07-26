
// 画像読み込み
async function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// 色付け処理
function colorize(img, hairColor, skinColor) {
  const hr = parseInt(hairColor.slice(1, 3), 16)
  const hg = parseInt(hairColor.slice(3, 5), 16)
  const hb = parseInt(hairColor.slice(5, 7), 16)
  const sr = parseInt(skinColor.slice(1, 3), 16)
  const sg = parseInt(skinColor.slice(3, 5), 16)
  const sb = parseInt(skinColor.slice(5, 7), 16)

  // オフスクリーンCanvas作成・描画
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const octx = canvas.getContext('2d')
  octx.drawImage(img, 0, 0)

  // ピクセルデータ毎に判定
  const data = octx.getImageData(0, 0, canvas.width, canvas.height)
  const th = 20
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2], a = data.data[i + 3]
    if (a === 0) continue

    const isGray = Math.abs(r - g) < th && Math.abs(g - b) < th
    if (isGray && r > 160){
      // 白塗り箇所を髪色に変換
      data.data[i] = hr
      data.data[i + 1] = hg
      data.data[i + 2] = hb
    } else if (Math.abs(r - 255) < th && Math.abs(g - 203) < th && Math.abs(b - 78) < th) {
      // 黄塗り箇所を肌色に変換
      data.data[i] = sr
      data.data[i + 1] = sg
      data.data[i + 2] = sb
    }
  }
  octx.putImageData(data, 0, 0)

  return canvas
}

// パーツ毎の描写
function drawPng(ctx, img, cx, cy, s, ox, flipX = false) {
  if (!img) return
  if (flipX) {
    // 反転描写
    ctx.save()
    ctx.translate(cx + ox, cy)
    ctx.scale(-1, 1)
    ctx.drawImage(img, -s / 2, -s / 2, s, s)
    ctx.restore()
  } else {
    // 正常描写
    ctx.drawImage(img, cx -s / 2 + ox, cy -s / 2, s, s)
  }
}

// 顔パーツ描写
export async function drawFace(ctx, cx, cy, size, face, faceParts, ox, tilt, angle = 0) {
  const get = (cat) => faceParts[cat]?.find((p) => p.id === face[cat])

  // はみ出し部分を非表示にするためのオフスクリーン
  const off    = document.createElement('canvas')
  off.width    = ctx.canvas.width
  off.height   = ctx.canvas.height
  const offCtx = off.getContext('2d')

  const hair  = get('hair')
  const eye   = get('eye')
  const nose  = get('nose')
  const mouth = get('mouth')
  const hairPath = hair?.img_path.replace('*', angle)

  // 画像取得
  const [hairImg, eyeImg, noseImg, mouthImg] = await Promise.all([
    hairPath        ? loadImg(hairPath)       : Promise.resolve(null),
    eye?.img_path   ? loadImg(eye.img_path)   : Promise.resolve(null),
    nose?.img_path  ? loadImg(nose.img_path)  : Promise.resolve(null),
    mouth?.img_path ? loadImg(mouth.img_path) : Promise.resolve(null),
  ])

  // 各パーツを描写
  // 髪
  const colorHairImg = face.hairColor && hairImg ? colorize(hairImg, face.hairColor, face.skinColor) : hairImg
  drawPng(offCtx, colorHairImg, cx, cy, size * 3.0, 0, ox > 0)

  // 既存の不透過領域のみに描写
  offCtx.globalCompositeOperation = 'source-atop'

  // 後ろ姿の場合は髪のみ描写
  if (angle < 135) {
    // 目（片目画像を左右に配置）
    const ey = size * 0.35  // 目の高さ
    let   ex = size * 0.25  // 目の離れ
    const eth = size * 0.5  // 閾値
    if (angle > 30) {
      // 角度がある場合に目の離れを調整
      ex = size * 0.15
    }
    // 左目
    if (ox > -1 * eth) {
      drawPng(offCtx, eyeImg, cx - ex, cy + ey, size, ox)
    }
    // 右目
    if (ox < eth) {
      drawPng(offCtx, eyeImg, cx + ex, cy + ey, size, ox, eye?.eye_turn)
    }

    // 鼻 ※45度以下で描写
    if (angle <= 45) {
      if (ox <= 0) {
        drawPng(offCtx, noseImg, cx - 2, cy + size * 0.4, size * 1.10, ox, ox > 0)
      } else {
        drawPng(offCtx, noseImg, cx + 2, cy + size * 0.4, size * 1.10, ox, ox > 0)
      }
    }

    // 口
    if (angle >= 30) {
      drawPng(offCtx, mouthImg, cx, cy + size * 0.59, size * 1.10, ox)
    } else {
      drawPng(offCtx, mouthImg, cx, cy + size * 0.55, size * 1.10, ox)
    }

    // チーク
    const ckx = size * 0.38   // 頬の横位置（目より少し外側）
    const cky = size * 0.55   // 頬の縦位置（鼻〜口の間）
    let ckr = size * 0.08     // 頬の半径
    if (angle > 30) {
      ckr = size * 0.12
    }
    offCtx.save()
    offCtx.globalAlpha = 0.80
    offCtx.fillStyle = '#FF9999'
    // 左頬
    offCtx.beginPath()
    offCtx.arc(cx - ckx + ox, cy + cky, ckr, 0, Math.PI * 2)
    offCtx.fill()
    // 右頬
    offCtx.beginPath()
    offCtx.arc(cx + ckx + ox, cy + cky, ckr, 0, Math.PI * 2)
    offCtx.fill()
    offCtx.restore()
  }

  // オフスクリーンをメインcanvasに転写
  if (tilt !== 0) {
    // 傾きあり
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(tilt * Math.PI / 180)
    ctx.drawImage(off, -cx, -cy)
    ctx.restore()
  } else {
    // 傾きなし
    ctx.drawImage(off, 0, 0)
  }
}
