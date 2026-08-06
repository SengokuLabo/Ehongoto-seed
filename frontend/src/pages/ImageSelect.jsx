import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import BookCanvas from '../components/BookCanvas'
import { mockData } from '../mock'
import { couponUse } from '../api/client'

const mock = import.meta.env.DEV ? mockData : null

// 画像選択フォーム
export default function ImageSelect() {
  const navigate = useNavigate()
  const location = useLocation()
  const { result, face } = location.state || {}
  const imgs = result?.images ?? mock.images
  const faceParts = result?.face_parts ?? mock.face_parts
  const lkToken = location.state?.lkToken ?? ''

  const [spreads, setSpreads] = useState(() => {
    const raw = result?.spreads ?? mock.spreads
    return raw.map((sp, i) => ({
      ...sp,
      img: sp.img ?? (i === 0 ? imgs[0] : null)
    }))
  })
  // 見開きインデックス
  const [step, setStep] = useState(0)
  const maxStep = spreads.length - 2
  const isCover = step === 0
  const isAllOk = spreads[maxStep].img

  // 使用済み画像リスト
  const usedImgs = spreads.filter((_, i) => i !== step && spreads[i].img).map(sp => sp.img.id)
  const sortImgs = [
    ...imgs.filter(img => !usedImgs.includes(img.id)),
    ...imgs.filter(img =>  usedImgs.includes(img.id)),
  ]

  // 画像切り替え
  const shiftImg = (dir) => {
    const curIdx = sortImgs.findIndex(img => img.id === spreads[step].img?.id)
    const nextIdx = (curIdx + dir + sortImgs.length) % sortImgs.length
    setSpreads(prev => {
      const next = [...prev]
      next[step] = { ...next[step], img: sortImgs[nextIdx] }
      return next
    })
  }

  const goToStep = (ns) => {
    const nUsed = spreads.filter((_, i) => i !== ns && spreads[i].img).map(sp => sp.img.id)
    const nSort = [
      ...imgs.filter(img => !nUsed.includes(img.id)),
      ...imgs.filter(img =>  nUsed.includes(img.id)),
    ]
    setSpreads(prev => {
      const next = [...prev]
      // 初期値がnullなので未選択の画像をセット
      if (!next[ns].img) next[ns] = { ...next[ns], img: nSort[0] }
      return next
    })
    setStep(ns)
  }

  // Previewへ遷移
  const handleNext = async () => {
    if (lkToken) {
      // クーポン使用時
      try {
        const res = await couponUse({ lk_token: lkToken, face, spreads, log_id: result?.log_id })
        navigate('/preview', {state: { ...location.state, result: { ...result, spreads }, lkToken, dlUrl: res.dl_url }})
      } catch (err) {
        // エラー時は再度クーポン入力
        navigate('/coupon', {state: { ...location.state, result: {...result, spreads} } })
      }
    } else {
      // 通常時
      navigate('/preview', { state: { ...location.state, result: { ...result, spreads } } })
    }
  }

  // FaceSelectへ戻る
  const handlePre = () => {
    navigate('/face', { state: { ...location.state, result: { ...result, spreads }, lkToken } })
  }

  return (
    <div className='imgsel_root'>
      <h2 className='imgsel_head'>{isCover ? '表紙を選んでください' : 'イラストを選んでください'}</h2>
      <h3>{step > 0 ? `見開き：${step} / ${maxStep} ページ目` : '表紙'}</h3>

      {/* プレビュー */}
      <div className='book_outer'>
        <BookCanvas
          spread={spreads[step]}
          face={face}
          faceParts={faceParts}
          isPreview={!isCover}
        />
        {!isCover &&
          <div className='book_spine' />
        }
      </div>
      <div className='book_dots'>
        {spreads.slice(0, -1).map((sp, idx) => (
          <span key={idx} className={idx === step ? 'dot_on' : 'dot_off'} />
        ))}
      </div>

      <div className='btns'>
        <button className='btn_pre' onClick={() => shiftImg(-1)}>◀</button>
        <span>画像切り替え</span>
        <button className='btn_nxt' onClick={() => shiftImg(+1)}>▶</button>
      </div>

      <div className='btns'>
        <button className='btn_back' onClick={() => setStep(step - 1)} disabled={step === 0}>前の見開き</button>
        <button className='btn_driv' onClick={() => goToStep(step + 1)} disabled={step === maxStep}>次の見開き</button>
      </div>

      <div className='btns btns_trans'>
        <button className='btn_back' onClick={handlePre}>顔選択へ戻る</button>
        <button className='btn_driv' onClick={handleNext} disabled={!isAllOk}>確認へ進む</button>
      </div>
    </div>
  )
}
