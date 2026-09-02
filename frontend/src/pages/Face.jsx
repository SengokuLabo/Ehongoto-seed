import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { drawFace } from '../utils/drawFace'
import { mockData } from '../mock'
import { useFadeIn } from '../hooks/useFadeIn'

const mock = import.meta.env.DEV ? mockData : null

const TABS = [
  { key: 'hair',  label: '髪' },
  { key: 'eye',   label: '目' },
  { key: 'nose',  label: '鼻' },
  { key: 'mouth', label: '口' },
]

// 顔パーツ選択フォーム
export default function Face() {
  const navigate = useNavigate()
  const location = useLocation()
  const { result } = location.state || {}
  const faceParts = result?.face_parts ?? mock.face_parts
  const hairColors = result?.hair_colors ?? mock.hair_colors
  const skinColors = result?.skin_colors ?? mock.skin_colors
  const previewRef = useRef(null)
  const lkToken = location.state?.lkToken ?? ''

  const [face, setFace] = useState(
    location.state?.face ?? {
      hair: faceParts.hair[0].id,
      eye: faceParts.eye[0].id,
      nose: faceParts.nose[0].id,
      mouth: faceParts.mouth[0].id,
      hairColor: hairColors?.[0].color ?? '#1a1a1a',
      skinColor: skinColors?.[0].color ?? '#fde8d0',
      eyeTurn: faceParts.eye[0].eye_turn,
    }
  )

  // 顔プレビューを再描画
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    const S    = canvas.width / 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawFace(ctx, S, S, S, face, faceParts, 0, 0)
  }, [face, faceParts])

  // パーツ変更
  const shiftPart = (key) => {
    // リスト取得
    const list = faceParts[key]
    // 変更前取得
    const idx = list.findIndex(p => p.id === face[key])
    // 変更後インデックス
    const nextIdx = (idx + 1) % list.length
    // パーツ更新
    setFace(prev => ({...prev, [key]: list[nextIdx].id}))
  }

  // 色変更
  const shiftColor = (type) => {
    // リスト取得(髪色 or 肌色)
    const list = type === 'hair' ? hairColors : skinColors
    // 変更前取得
    const curColor = type === 'hair' ? face.hairColor : face.skinColor
    const idx = list.findIndex(c => c.color === curColor)
    // 変更後インデックス
    const nextIdx = (idx + 1) % list.length
    // 色更新
    setFace(prev => ({...prev, [type + 'Color']: list[nextIdx].color}))
  }

  // Imageへ遷移
  const handleNext = () => {
    navigate('/image', { state: { ...location.state, face, lkToken } })
  }

  // Questionへ戻る
  const handlePre = () => {
    navigate('/' + (location.state?.search ?? ''), { state: { ...location.state, face, lkToken } })
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='facesel'>
      <div className='section_cont'>
        <h2 className='fade_in'>顔パーツを選んでください</h2>

        {/* 顔プレビュー */}
        <div className='facesel_preview fade_in'>
          <canvas ref={previewRef} width={300} height={300} />
        </div>

        {/* パーツ切り替えボタン */}
        <h3 className='fade_in'>パーツ選択</h3>
        <div className='btns btns_parts fade_in'>
          {TABS.map(({ key, label }) => (
            <button className={`btn_${key}`} key={key} onClick={() => shiftPart(key)}>{label}</button>
          ))}
        </div>

        {/* 色切り替えボタン */}
        <h3 className='fade_in'>色選択</h3>
        <div className='btns btns_color fade_in'>
          <button className='btn_color_h' onClick={() => shiftColor('hair')}>髪色</button>
          <button className='btn_color_s' onClick={() => shiftColor('skin')}>肌色</button>
        </div>

        <div className='btns_trans fade_in'>
          <button className='btn_back' onClick={handlePre}>戻る</button>
          <button className='btn_driv' onClick={handleNext}>次へ</button>
        </div>
      </div>
    </section>
  )
}
