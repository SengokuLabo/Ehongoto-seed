import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import BookCanvas from '../components/BookCanvas'
import WaitModal from '../components/WaitModal'
import { getEhon } from '../api/client'
import { drawSpread } from '../utils/drawSpread'
import { mockData } from '../mock'
import Modal from '../components/Modal'

const mock = import.meta.env.DEV ? mockData : null

// プレビューフォーム
export default function Preview() {
  const navigate = useNavigate()
  const location = useLocation()
  const sharing = useRef(false)
  const initState = location.state || {}
  const [result, setResult] = useState(initState.result)
  const [face, setFace] = useState(initState.face ?? mock?.face)
  const [isModal, setIsModal] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [snsBlob, setSnsBlob] = useState(null)
  const isPc = navigator.maxTouchPoints == 0    // True:PC False:スマホ

  // ダウンロード用トークン
  const { token } = useParams()
  const [apiData, setApiData] = useState(null)
  const [apiErr, setApiErr] = useState(null)

  let spreads = result?.spreads ?? mock?.spreads ?? []
  let faceParts = result?.face_parts ?? mock?.face_parts ?? []

  const W = useMemo(() => Math.min(Math.floor(window.innerWidth * 0.90), 720), [])   // プレビュー横幅
  const H = useMemo(() => Math.round(W * (507 / 720)), [W])                          // プレビュー高さ
  const FLIP_MS = 1200                        // アニメーション秒数
  const [step, setStep] = useState(0)         // 表示中の見開き
  const [isFlipping, setIsFlipping] = useState(false)  // めくり動作中フラグ
  const [dir, setDir] = useState('next')      // (next, prev)
  const [wrapW, setWrapW] = useState(0)       // カード親要素幅
  const isCover = (s) => s === 0              // 表紙
  const lkToken = location.state?.lkToken ?? ''
  const isPreview = !token && !lkToken        // モザイク判定
  const canvasRefs = useRef({})               // canvas要素
  const readyMap = useRef({})                 // 描画完了フラグ
  const flipFrontRef = useRef(null)           // カード表面のcanvas
  const flipBackRef = useRef(null)            // カード裏面のcanvas
  const fixLeftRef = useRef(null)             // めくり中の左固定canvas
  const fixRightRef = useRef(null)            // めくり中の右固定canvas
  const pageIdx = (s) => ({
    left:  s === 0 ? null : s * 2 - 1,
    right: s === 0 ? 0    : s * 2
  })

  // 絵本データ取得API
  useEffect(() => {
    if (!token) return
    getEhon(token)
      .then(data => setApiData(data))
      .catch(err => setApiErr(err?.error || 'エラーが発生しました'))
  }, [token])

  useEffect(() => {
    if (apiData) {
      setResult(apiData)
      setFace(apiData.face)
    }
  }, [apiData])

  // PDFダウンロード
  const generatePdf = async () => {
    setPdfLoading(true)
    try {
      const pdf = new jsPDF({ unit: 'px', format: [W / 2, H] })
      for (let i = 0; i < spreads.length - 1; i++) {
        const sp = spreads[i]
        const canvas = document.createElement('canvas')
        const pdfW = sp.sp_num === 0 ? W / 2 : W
        canvas.width = pdfW * 2
        canvas.height = H * 2
        await drawSpread(canvas, sp, face, faceParts, false)
        if (i > 0) pdf.addPage([pdfW, H], 'landscape')
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, H)
      }
      pdf.save(`${result?.title ?? 'ehon'}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

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
    if (isFlipping) return

    // コピー元のindexを決定
    const frontIdx = direction === 'next' ? pageIdx(step).right : pageIdx(step).left
    const backIdx = direction === 'next' ? pageIdx(dest).left : pageIdx(dest).right
    const fixLeftIdx = direction === 'next' ? pageIdx(step).left : pageIdx(dest).left
    const fixRightIdx = direction === 'next' ? pageIdx(dest).right : pageIdx(step).right

    // 描画未完了の場合はスキップ
    if (!readyMap.current[frontIdx] || (backIdx !== null && !readyMap.current[backIdx])) return

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
    new Audio('/media/flip.mp3').play()

    // カード親要素幅調整
    if (isCover(step)) setWrapW(W)
    if (isCover(dest)) setWrapW(0)

    setDir(direction)
    setIsFlipping(true)

    setTimeout(() => {
      setStep(dest)
      setIsFlipping(false)
    }, FLIP_MS)
  }

  // Purchaseへ遷移
  const handleNext = () => {
    navigate('/purchase', { state: { ...location.state, } })
  }

  // ImageSelectへ戻る
  const handlePre = () => {
    navigate('/image', { state: { ...location.state, } })
  }

  // ダウンロード時フォーム
  if (apiErr) {
    return <p>{apiErr}</p>
  } else if (token && !apiData) {
    return <p>読み込み中．．．</p>
  }

  // SNSシェア
  const handleShare = async () => {
    if (!snsBlob || sharing.current) return
    const file = new File([snsBlob], 'ehon.png', { type: 'image/png' })
    const text = `『${spreads[0]?.text1}』を作ったよ！ #えほんごとのたね #AI生成絵本`
    if (!isPc && navigator.canShare?.({ files: [file] })) {
      // スマホ：シェアシート
      try {
        sharing.current = true
        await navigator.share({ files: [file], text: text, url: 'https://ehongoto-seed.com' })
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
      } finally {
        sharing.current = false
      }
    } else {
      // PC：表紙ダウンロード
      const url = URL.createObjectURL(snsBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ehon.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className='preview'>
      <div className='preview_head'>
        <h2>オリジナル絵本</h2>
        <button className='btn_sns' onClick={() => setIsModal(true)}>SNS</button>
      </div>
      <div className='thankyou' hidden={isPreview}>
        <h4>ご購入ありがとうございます。</h4>
        <div className='btns_dl'>
          <button className='btn_dl' onClick={generatePdf} disabled={pdfLoading}
            style={{display: (token || lkToken) ? 'inline-block' : 'none'}}
          >
            {pdfLoading ? '生成中．．．' : 'PDFダウンロード'}
          </button>
        </div>
      </div>

      {/* プレビュー */}
      <div
        className={`book_outer ${isFlipping ? `flip_${dir}` : ''}`}
        style={{ width: wrapW, minWidth: W/2, height: H, transition: `width ${FLIP_MS}ms ease-in-out` }}
      >
        {[-1, 0, 1].map(offset => {
          const s = step + offset
          const { left, right } = pageIdx(s)
          if (s < 0 || s >= spreads.length - 1) return null

          return (
            <div className={`canvas_${s}`} key={s} style={{ position: 'absolute', left: 0, display: (offset === 0 && !isFlipping) ? 'flex' : 'none' }}>
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
        <div className='book_spine' style={{ opacity: isCover(step) || (isFlipping && wrapW === 0) ? 0 : 1 }} />

        {/* めくり時要素 */}
        <div className='flip_wrap'
          style={{
            width: wrapW, minWidth: W/2, height: H,
            visibility: isFlipping ? 'visible' : 'hidden', transition: `width ${FLIP_MS}ms ease-in-out`
          }}
        >
          {/* めくり中の背面canvas */}
          <canvas className='flip_fix_left' ref={fixLeftRef}
            style={{ display: isFlipping ? 'block' : 'none' }}
          />
          <div className='flip_fix_right'>
            <canvas ref={fixRightRef}
            style={{ display: isFlipping ? 'block' : 'none'}}
            />
            {/* カード */}
            <div className='flip_card'
              style={{
                animationDuration: `${FLIP_MS}ms`, width: W / 2, height: H,
                left: dir === 'next' ? 0 : -W/2
              }}
            >
              <div className='flip_front'><canvas ref={flipFrontRef} /></div>
              <div className='flip_back'><canvas ref={flipBackRef} /></div>
            </div>
          </div>
        </div>
      </div>
      <div className='book_dots'>
        {spreads.slice(0, -1).map((sp, idx) => (
          <span key={idx} className={idx === step ? 'dot_on' : 'dot_off'} />
        ))}
      </div>

      <div className='btns'>
        <button className='btn_pre' onClick={() => flip(step - 1, 'prev')} disabled={step === 0}>←</button>
        <button className='btn_nxt' onClick={() => flip(step + 1, 'next')} disabled={step === spreads.length - 2}>→</button>
      </div>

      {/*  */}
      {isPreview &&
        <div className='btns_trans'>
          <button className='btn_back' onClick={handlePre}>戻る</button>
          <button className='btn_driv' onClick={handleNext} hidden={!isPreview}>購入</button>
        </div>
      }

      {/* SNSシェアモーダル */}
      {isModal &&
        <Modal onClose={() => setIsModal(false)} title={'SNSシェア'}
        cont={<>
          <div className='book_outer'>
            <BookCanvas spread={{ ...spreads[0] }} face={face} faceParts={faceParts} isPreview={false}
              onReady={canvas => canvas.toBlob(b => setSnsBlob(b), 'image/png')} w={W * 0.7} />
          </div>
          <button className='btn_sns' onClick={handleShare} disabled={!snsBlob}>
            {isPc ? '画像を保存' : 'シェア'}
          </button>
        </>} />}

      {pdfLoading && (<WaitModal text={'PDF生成中'} />)}
    </div>
  )
}
