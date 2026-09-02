import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { themes } from '../api/client'
import { useFadeIn } from '../hooks/useFadeIn'

// テーマ一覧フォーム
export default function Themes() {
  const navigate = useNavigate()
  const [themeList, setThemeList] = useState([])
  const [paramError, setParamError] = useState(false)

  // パラメータ取得
  const [serchParams] = useSearchParams()
  const client = serchParams.get('client')

  useEffect(() => {
    if (!client) return
    themes(client)
      .then(data => {
        if (data.themes.length === 0) setParamError(true)
        else setThemeList(data.themes)
      })
      .catch(() => setParamError(true))
  }, [client])

  // エラー時の表示
  if (!client || paramError) {
    return (
      <div className='section_cont'>
        <p>クライアントが無効です</p>
        <p>クライアントにURLを確認してください</p>
      </div>
    )
  }

  // フェードインアニメーション
  useFadeIn(themeList.length > 0)

  return (
    <section className='themes'>
      <div className='section_cont'>
        <h2 className='fade_in'>{client}</h2>
        <h4 className='fade_in'>テーマ一覧</h4>
        {themeList.map(t => (
          <button className='btn_driv fade_in' key={t.name} onClick={() => navigate(`/?client=${client}&theme=${t.name}`)}>
            <p>{t.name}</p>
            {t.year && <p>{t.year} 年</p>}
          </button>
        ))}
      </div>
    </section>
  )
}
