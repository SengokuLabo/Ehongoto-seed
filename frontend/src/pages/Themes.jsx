import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { themes } from "../api/client"

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
      <div>
        <p>クライアントが無効です</p>
        <p>クライアントにURLを確認してください</p>
      </div>
    )
  }

  return (
    <div className='themes'>
      <h2>{client}</h2>
      <h4>テーマ一覧</h4>
      {themeList.map(t => (
        <button className="btn_driv" key={t.name} onClick={() => navigate(`/?client=${client}&theme=${t.name}`)}>
          <p>{t.name}</p>
          {t.year && <p>{t.year} 年</p>}
        </button>
      ))}
    </div>
  )
}
