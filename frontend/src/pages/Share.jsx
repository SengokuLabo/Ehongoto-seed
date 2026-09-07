import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'
import { useEffect, useState } from 'react'
import { getShareEhon } from '../api/client'
import { drawSpread } from '../utils/drawSpread'
import jsPDF from 'jspdf'
import BookPreview from '../components/BookPreview'
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
          await drawSpread(canvas, sp, result?.face, result?.face_parts, false)
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

  // フェードインアニメーション
  useFadeIn(result)

  return (
    <section className='share'>
      <div className='section_cont'>
        <h2 className='fade_in'>{result?.title}</h2>

        {/* プレビュー */}
        {result &&
          <div className='fade_in'>
            <BookPreview spreads={result?.spreads} face={result?.face} faceParts={result?.face_parts} isPreview={false} W={W} isAuto={false} />
          </div>
        }

        <div className='btns_trans fade_in'>
          <button className='btn_back' onClick={() => navigate('/')}>{isPc ? '他のテーマを見る' : '他テーマ'}</button>
          <button className='btn_driv' onClick={() => navigate(`/?client=${result?.client}&theme=${result?.theme}`)}>試してみる</button>
        </div>
      </div>

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
