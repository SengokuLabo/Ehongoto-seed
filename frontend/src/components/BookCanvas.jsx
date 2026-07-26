import { useRef, useEffect } from 'react'
import { drawSpread } from '../utils/drawSpread'

/**
 * 絵本1ページを Canvas に描画するコンポーネント
 *
 * props:
 *   spread    - 見開き(2ページ分)
 *   face      - 選択中の顔パーツ { hair, eye, nose, mouth, hairColor, skinColor }
 *   faceParts - パーツ一覧
 *   isPreview - 外枠、ウォーターマーク表示（購入前）
 *   onReady   - 描写完了コールバック
 *   w         - canvas 幅（px）
 *   side      - ページめくり描写ように片面描写設定
 */
export default function BookCanvas({ spread, face, faceParts, isPreview, onReady, w = 720, side = null, classNm = 'canvas' }) {
  const canvasRef = useRef(null)
  // 表紙判定
  const isCover = spread?.sp_num === 0
  const halfW = Math.round(w / 2)
  const width = (side || isCover) ? halfW : w
  const height = Math.round(w * (507 / 720))

  useEffect(() => {
    // オフスクリーンcanvasへ描写
    const canvas = canvasRef.current
    if (!canvas || !spread) return

    const temp = document.createElement('canvas')
    temp.width = canvas.width
    temp.height = canvas.height

    if (side) {
      // ページめくりように片面描写
      const off = document.createElement('canvas')
      off.width = w
      off.height = height
      drawSpread(off, spread, face, faceParts, isPreview).then(() => {
        const ctx = temp.getContext('2d')
        ctx.clearRect(0, 0, halfW, height)
        ctx.drawImage(off, side === 'right' ? halfW : 0, 0, halfW, height, 0, 0, halfW, height)
        canvas.getContext('2d').drawImage(temp, 0, 0)
        onReady?.(canvas)
      })
    } else {
      // 見開き描写
      drawSpread(temp, spread, face, faceParts, isPreview).then(() => {
        canvas.getContext('2d').drawImage(temp, 0, 0)
        onReady?.(canvas)
      })
    }
  }, [spread, isPreview, side])

  return (
    <canvas
      className={classNm}
      ref={canvasRef}
      width={width}
      height={height}
    />
  )
}
