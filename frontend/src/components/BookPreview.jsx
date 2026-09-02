import { useState, useMemo, useRef, useEffect } from 'react'
import BookCanvas from './BookCanvas'

/**
 * 絵本プレビューコンポーネント
 * @param {Array}     spreads     絵本データ
 * @param {Object}    face        顔データ
 * @param {Array}     faceParts   顔パーツ一覧
 * @param {boolean}   isPreview   ウォーターマーク表示フラグ
 * @param {number}    W           横幅
 * @param {boolean}   isAuto      自動めくりフラグ
 */
export default function BookPreview({ spreads, face, faceParts, isPreview, W, isAuto }) {
  const FLIP_MS = 1200                        // アニメーション秒数
  const WAIT_MS = 800                         // アニメーション待機秒数
  const [step, setStep] = useState(isAuto ? 1 : 0) // 表示中の見開き
  const [isFlip, setIsFlip] = useState(false)  // めくり動作中フラグ
  const [dir, setDir] = useState('next')      // (next, prev)
  const [wrapW, setWrapW] = useState(isAuto ? W : 0) // カード親要素幅

  const canvasRefs = useRef({})               // canvas要素
  const readyMap = useRef({})                 // 描画完了フラグ
  const flipFrontRef = useRef(null)           // カード表面のcanvas
  const flipBackRef = useRef(null)            // カード裏面のcanvas
  const fixLeftRef = useRef(null)             // めくり中の左固定canvas
  const fixRightRef = useRef(null)            // めくり中の右固定canvas
  const isFlipRef = useRef(false)             //

  const H = Math.round(W * (507 / 720))       // プレビュー高さ
  const isCover = (s) => s === 0              // 表紙
  const pageIdx = (s) => ({
    left:  s === 0 ? null : s * 2 - 1,
    right: s === 0 ? 0    : s * 2
  })

  // スプレッドからページリストを作成
  const pages = useMemo(() => {
    const list = []
    spreads.slice(0, -1).forEach((sp, i) => {
      if (i === 0) {
        // 表紙
        list.push({ spread: sp, side: null })
      } else {
        list.push({ spread: sp, side: 'left' })
        list.push({ spread: sp, side: 'right' })
      }
    })
    return list
  }, [spreads])

  // めくりアニメーション
  const flip = ( dest, direction ) => {
    if (isFlip || isFlipRef.current) return false

    // コピー元のindexを決定
    const frontIdx = direction === 'next' ? pageIdx(step).right : pageIdx(step).left
    const backIdx = direction === 'next' ? pageIdx(dest).left : pageIdx(dest).right
    const fixLeftIdx = direction === 'next' ? pageIdx(step).left : pageIdx(dest).left
    const fixRightIdx = direction === 'next' ? pageIdx(dest).right : pageIdx(step).right

    // 描画未完了の場合はスキップ
    if (!readyMap.current[frontIdx] || (backIdx !== null && !readyMap.current[backIdx])) return false

    // カードにcanvasをコピー
    const copyTo = (ref, srcIdx) => {
      if (!ref.current) return
      if (srcIdx === null) {
        ref.current.width = 0
        return
      }
      const src = canvasRefs.current[srcIdx]
      if (!src) return
      ref.current.width = src.width
      ref.current.height = src.height
      ref.current.getContext('2d').drawImage(src, 0, 0)
    }
    copyTo(flipFrontRef, frontIdx)
    copyTo(flipBackRef, backIdx)
    copyTo(fixLeftRef, fixLeftIdx)
    copyTo(fixRightRef, fixRightIdx)

    // SE：めくる音
    if (! isAuto) {
      new Audio('/media/flip.mp3').play()
    }

    // カード親要素幅調整
    if (isCover(step)) setWrapW(W)
    if (isCover(dest)) setWrapW(0)

    setDir(direction)
    setIsFlip(true)
    isFlipRef.current = true

    setTimeout(() => {
      setStep(dest)
      setIsFlip(false)
      isFlipRef.current = false
    }, FLIP_MS)

    return true
  }

  // 自動めくり動作
  const tryFlip = (timer_dest, timer_dir) => {
    if (!flip(timer_dest, timer_dir)) setTimeout(() => tryFlip(timer_dest, timer_dir), 500)
  }
  useEffect(() => {
    if (!isAuto) return
    if (step === 1) {
      const t = setTimeout(() => { tryFlip(2, 'next') }, FLIP_MS + WAIT_MS);
      return() => clearTimeout(t)
    } else {
      const t = setTimeout(() => { tryFlip(1, 'prev') }, FLIP_MS + WAIT_MS);
      return() => clearTimeout(t)
    }
  }, [step, isAuto])

  return (
    <>
      <div
        className={`book_outer ${isFlip ? `flip_${dir}` : ''}`}
        style={{ width: wrapW, minWidth: W/2, height: H, transition: `width ${FLIP_MS}ms ease-in-out` }}
      >
        {[-1, 0, 1].map(offset => {
          const s = step + offset
          const { left, right } = pageIdx(s)
          if (s < 0 || s >= spreads.length - 1) return null

          return (
            <div className={`canvas_${s}`} key={s} style={{ position: 'absolute', left: 0, display: (offset === 0 && !isFlip) ? 'flex' : 'none' }}>
              {left !== null && (
                <BookCanvas
                  spread={pages[left].spread} side='left'
                  face={face} faceParts={faceParts} isPreview={isPreview} w={W}
                  onReady={c => { canvasRefs.current[left] = c; readyMap.current[left] = true }}
                />
              )}
              <BookCanvas
                spread={pages[right].spread} side={pages[right].side}
                face={face} faceParts={faceParts} isPreview={isPreview} w={W}
                onReady={c => { canvasRefs.current[right] = c; readyMap.current[right] = true }}
              />
            </div>
          )
        })}

        {/* 見開きの綴じ目 */}
        <div className='book_spine' style={{ opacity: isCover(step) || (isFlip && wrapW === 0) ? 0 : 1 }} />

        {/* めくり時要素 */}
        <div className='flip_wrap'
          style={{
            width: wrapW, minWidth: W/2, height: H,
            visibility: isFlip ? 'visible' : 'hidden', transition: `width ${FLIP_MS}ms ease-in-out`
          }}
        >
          {/* めくり中の背面canvas */}
          <canvas className='flip_fix_left' ref={fixLeftRef}
            style={{ display: isFlip ? 'block' : 'none' }}
          />
          <div className='flip_fix_right'>
            <canvas ref={fixRightRef}
            style={{ display: isFlip ? 'block' : 'none'}}
            />
            {/* カード */}
            <div className='flip_card'
              style={{
                animationDuration: `${FLIP_MS}ms`, width: W/2, height: H,
                left: dir === 'next' ? 0 : -W/2
              }}
            >
              <div className='flip_front'><canvas ref={flipFrontRef} /></div>
              <div className='flip_back'><canvas ref={flipBackRef} /></div>
            </div>
          </div>
        </div>
      </div>

      {!isAuto &&
        <>
          {/* ドット */}
          <div className='book_dots'>
            {spreads.slice(0, -1).map((sp, idx) => (
              <span key={idx} className={idx === step ? 'dot_on' : 'dot_off'} />
            ))}
        </div>

          {/* 切り替えボタン */}
          <div className='btns'>
            <button className='btn_pre' onClick={() => flip(step - 1, 'prev')} disabled={step === 0}>←</button>
            <button className='btn_nxt' onClick={() => flip(step + 1, 'next')} disabled={step === spreads.length - 2}>→</button>
          </div>
        </>
      }
    </>
  )
}
