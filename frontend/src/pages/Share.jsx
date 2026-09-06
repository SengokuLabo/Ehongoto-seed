import { useNavigate, useParams } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'
import { useEffect, useState } from 'react'
import { getShareEhon } from '../api/client'
import BookPreview from '../components/BookPreview'
import Modal from '../components/Modal'

// シェア画面
export default function Share() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [result, setResult] = useState(null)
  const [apiErr, setApiErr] = useState(null)
  const W = Math.min(Math.floor(window.innerWidth * 0.90), 720)
  const isPc = navigator.maxTouchPoints == 0

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
