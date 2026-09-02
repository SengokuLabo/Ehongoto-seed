import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import BookCanvas from '../components/BookCanvas'
import BookPreview from '../components/BookPreview'
import WaitModal from '../components/WaitModal'
import { getEhon } from '../api/client'
import { drawSpread } from '../utils/drawSpread'
import { mockData } from '../mock'
import Modal from '../components/Modal'
import { useFadeIn } from '../hooks/useFadeIn'

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
  const lkToken = location.state?.lkToken ?? ''
  const isPreview = !token && !lkToken        // モザイク判定

  // フェードインアニメーション
  useFadeIn()

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

  // SNSシェア用canvas作成
  useEffect(() => {
    if (!isModal || snsBlob) return
    const off = document.createElement('canvas')
    off.width = 720
    off.height = 1014
    drawSpread(off, spreads[0], face, faceParts, false)
    .then(() => off.toBlob(b => setSnsBlob(b), 'image/png'))
  }, [isModal])

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

  // Purchaseへ遷移
  const handleNext = () => {
    navigate('/purchase', { state: { ...location.state, } })
  }

  // Imageへ戻る
  const handlePre = () => {
    navigate('/image', { state: { ...location.state, } })
  }

  // ダウンロード時フォーム
  if (apiErr) {
    return <div className='section_cont'><p>{apiErr}</p></div>
  } else if (token && !apiData) {
    return <div className='section_cont'><p>読み込み中．．．</p></div>
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
    <section className='preview'>
      <div className='section_cont'>
        <div className='preview_head'>
          <h2 className='fade_in'>絵本確認</h2>
          <button className='btn_sns fade_in' onClick={() => setIsModal(true)}>SNS</button>
        </div>
        <div className='thankyou fade_in' hidden={isPreview}>
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
        <div className='fade_in'>
          <BookPreview spreads={spreads} face={face} faceParts={faceParts} isPreview={isPreview} W={W} isAuto={false} />
        </div>

        {isPreview &&
          <div className='btns_trans fade_in'>
            <button className='btn_back' onClick={handlePre}>戻る</button>
            <button className='btn_driv' onClick={handleNext} hidden={!isPreview}>購入</button>
          </div>
        }

        {/* SNSシェアモーダル */}
        {isModal &&
          <Modal onClose={() => setIsModal(false)} title={'SNSシェア'}
          cont={<>
            <div className='book_outer'>
              <BookCanvas spread={{ ...spreads[0] }} face={face} faceParts={faceParts} isPreview={false} w={W * 0.7} />
            </div>
            <button className='btn_sns' onClick={handleShare} disabled={!snsBlob}>
              {isPc ? '画像を保存' : 'シェア'}
            </button>
          </>} />}

        {pdfLoading && (<WaitModal text={'PDF生成中'} />)}
      </div>
    </section>
  )
}
