
// マスクデータから座標抽出
export function parseMask(maskImg) {
  // オフスクリーンcanvasへ描写
  const canvas = document.createElement('canvas')
  canvas.width = maskImg.width
  canvas.height = maskImg.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(maskImg, 0, 0)

  // マスクデータのRGBA値を1次元配列で取得
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data, width, height } = imgData

  // 閾値
  const th = 30

  // 顔パーツ用変数
  let faceX = 0, faceY = 0, faceCnt = 0
  // テキストエリア用変数
  let txtLMinX = Infinity, txtLMaxX = -1, txtLMinY = Infinity, txtLMaxY = -1
  let txtRMinX = Infinity, txtRMaxX = -1, txtRMinY = Infinity, txtRMaxY = -1
  // 表紙エリア用変数
  let covX = Infinity

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    const idx = i / 4
    const x = idx % width
    const y = Math.floor(idx / width)

    if (r < th && Math.abs(g - 255) < th && b < th) {
      // 顔パーツ配置領域を取得 ※緑丸
      faceX += x; faceY += y; faceCnt++

    } else if (Math.abs(r - 255) < th && Math.abs(g - 255) < th && Math.abs(b - 255) < th) {
      // テキスト配置領域を取得 ※白塗り
      if (x < width / 2) {
        // 左ページ
        txtLMinX = Math.min(txtLMinX, x); txtLMaxX = Math.max(txtLMaxX, x)
        txtLMinY = Math.min(txtLMinY, y); txtLMaxY = Math.max(txtLMaxY, y)
      } else {
        // 右ページ
        txtRMinX = Math.min(txtRMinX, x); txtRMaxX = Math.max(txtRMaxX, x)
        txtRMinY = Math.min(txtRMinY, y); txtRMaxY = Math.max(txtRMaxY, y)
      }

    } else if (covX === Infinity && r < th && g < th && b < th && a > 200) {
      // 表紙配置領域の起点を取得 ※黒線
      if (x > width / 2) {
        // 幅が画像幅の半分と固定なので、起点が右寄りになっている場合はセンターを指定
        covX = width / 2
      } else {
        covX = x
      }
    }
  }

  // 顔パーツ
  const facePoint = faceCnt > 0 ? { cx: (faceX / faceCnt) / width, cy: (faceY / faceCnt) / height } : null

  // テキスト
  const toZone = (minX, maxX, minY, maxY) => ({
    x: minX / width,
    y: minY / height,
    w: (maxX - minX) / width,
    h: (maxY - minY) / height,
  })
  const txtArea = []
  if (txtLMaxX >= 0) txtArea.push(toZone(txtLMinX, txtLMaxX, txtLMinY, txtLMaxY))
  if (txtRMaxX >= 0) txtArea.push(toZone(txtRMinX, txtRMaxX, txtRMinY, txtRMaxY))

  // 表紙
  const covArea = covX < Infinity ? {x: covX / width, y: 0, w: 0.5, h: 1.0} : null

  return {
    face: facePoint,
    txtArea: txtArea,
    covArea: covArea,
  }
}
