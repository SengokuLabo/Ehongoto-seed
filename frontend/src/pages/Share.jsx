import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'
import { useEffect, useState, useRef } from 'react'
import { getShareEhon } from '../api/client'
import { drawSpread } from '../utils/drawSpread'
import jsPDF from 'jspdf'
import BookPreview from '../components/BookPreview'
import BookCanvas from '../components/BookCanvas'
import Modal from '../components/Modal'

// シェア画面
export default function Share() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [result, setResult] = useState(null)
  const [apiErr, setApiErr] = useState(null)
  const W = Math.min(Math.floor(window.innerWidth * 0.90), 720)
  const H = Math.round(W * (507 / 720))
  const isPc = navigator.maxTouchPoints == 0
  const titleStyle = result?.title_style

  // SNSシェア用
  const sharing = useRef(false)
  const [isSns, setIsSns] = useState(false)
  const [snsBlob, setSnsBlob] = useState(null)
  const [isCopy, setIsCopy] = useState(false)
  const DOMAIN = 'https://ehongoto-seed.com'

  // パラメータ
  const { pathname } = useLocation()

  // 絵本データ取得
  useEffect(() => {
    (async () => {
      try {
        const res = await getShareEhon(token)
        setResult(res)
      } catch (err) {
        setApiErr('データ取得時にエラーが発生しました')
      }
    })()
  }, [token])

  // SNSシェア用canvas作成
  useEffect(() => {
    if (!isSns || snsBlob) return
    const off = document.createElement('canvas')
    off.width = 720; off.height = 1014
    drawSpread(off, result?.spreads[0], result?.face, result?.face_parts, false, null, titleStyle)
      .then(() => off.toBlob(b => setSnsBlob(b), 'image/png'))
  }, [isSns])


  // 製本用PDFデータ取得
  useEffect(() => {
    (async () => {
      if (!pathname.startsWith('/bind') || !result) return

      const pdf = new jsPDF({ unit: 'px', format: [W / 2, H] })
      for (let i = 0; i < result?.spreads.length - 1; i++) {
        const sp = result?.spreads[i]
        const canvas = document.createElement('canvas')
        const pdfW = W / 2
        canvas.width = (sp.sp_num === 0 ? W / 2 : W) * 2
        canvas.height = H * 2

        if (sp.sp_num === 0) {
          // 表紙
          await drawSpread(canvas, sp, result?.face, result?.face_parts, false, null, result?.title_style)
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, H)
        } else {
          // 本文: 見開きを左右に分割して追加
          await drawSpread(canvas, sp, result?.face, result?.face_parts, false, W)

          // 左ページ
          const left = document.createElement('canvas')
          left.width = pdfW
          left.height = H
          left.getContext('2d').drawImage(canvas, 0, 0, W, H * 2, 0, 0, pdfW, H)
          pdf.addPage([pdfW, H])
          pdf.addImage(left.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, H)

          // 右ページ
          const right = document.createElement('canvas')
          right.width = pdfW
          right.height = H
          right.getContext('2d').drawImage(canvas, W, 0, W, H * 2, 0, 0, pdfW, H)
          pdf.addPage([pdfW, H])
          pdf.addImage(right.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, H)
        }
      }
      pdf.save(`製本依頼_${result?.title ?? 'ehon'}.pdf`)
    })()
  }, [result])

  // SNSシェア
  const handleShare = async () => {
    if (!snsBlob || sharing.current) return
    const file = new File([snsBlob], 'ehon.png', { type: 'image/png' })
    const text = `『${spreads[0]?.text1}』を作ったよ！ #えほんごとのたね #AI生成絵本`
    if (!isPc && navigator.canShare?.({ files: [file] })) {
      // スマホ：シェアシート
      try {
        sharing.current = true
        await navigator.share({ files: [file], text: text, url: token? `${DOMAIN}/share/${token}` : DOMAIN })
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

  // フェードインアニメーション
  useFadeIn(result)

  return (
    <section className='share'>
      <div className='section_cont'>
        <div className='share_head'>
          <h2 className='fade_in'>{result?.title}</h2>
          <button className='btn_sns fade_in' onClick={() => setIsSns(true)}>SNS</button>
        </div>

        {/* プレビュー */}
        {result &&
          <div className='fade_in'>
            <BookPreview spreads={result?.spreads} face={result?.face} faceParts={result?.face_parts} isPreview={false} W={W} isAuto={false} titleStyle={titleStyle} />
          </div>
        }

        <div className='btns_trans fade_in'>
          <button className='btn_back' onClick={() => navigate('/')}>{isPc ? '他のテーマを見る' : '他テーマ'}</button>
          <button className='btn_driv' onClick={() => navigate(`/?client=${result?.client}&theme=${result?.theme}`)}>試してみる</button>
        </div>
      </div>

      {/* SNSシェアモーダル */}
      {isSns &&
        <Modal onClose={() => setIsSns(false)} title={'SNSシェア'}
        cont={<>
          <div className='book_outer'>
            <BookCanvas spread={{ ...result?.spreads[0] }} face={result?.face} faceParts={result?.face_parts} isPreview={false} w={W * 0.7} titleStyle={titleStyle} />
          </div>
          <div className='btns'>
            <button className='btn_dl' onClick={async() => {
              await navigator.clipboard.writeText(`${DOMAIN}/share/${token}`)
              setIsCopy(true)
              setTimeout(() => setIsCopy(false), 2000)
            }} >
              {isCopy ? 'コピー成功！' : 'URLをコピー'}
            </button>
            <button className='btn_sns' onClick={handleShare} disabled={!snsBlob}>
              {isPc ? '画像を保存' : 'シェア'}
            </button>
          </div>
        </>} />
      }

      {/* エラー時のモーダル */}
      {apiErr &&
        <Modal onClose={() => navigate('/')} title={'データ取得失敗'}
        cont={<>
          <p>{apiErr}</p>
          <p>ホーム画面にもどります</p>
          <button className='btn_back' onClick={() => navigate('/')}>ホーム画面</button>
        </>} />
      }
    </section>
  )
}
