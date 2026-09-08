import React, { useEffect, useState } from 'react'
import { useFadeIn } from '../hooks/useFadeIn'
import { qsEntry, qsGet } from '../api/client'
import { useLocation, useNavigate } from 'react-router-dom'


// クライアント 質問更新
export default function ClientQs() {
  const navigate = useNavigate()
  const locate = useLocation()
  const theme_id = locate.state?.theme_id
  const [init, setInit] = useState([])
  const [qs, setQs] = useState([])
  const [apiRes, setApiRes] = useState('')

  // 質問一覧取得
  useEffect(() => {
    (async () => {
      try {
        const res = await qsGet(theme_id)
        setInit(res.qs.map(q => q.text))
        setQs(res.qs.map(q => q.text))
        setApiRes('')
      } catch (err) {
        setApiRes('データ取得失敗しました')
      }
    })()
  }, [])

  // 高さ調整
  useEffect(() => {
    document.querySelectorAll('.client_qs textarea').forEach(el => {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    })
  }, [qs.length])

  // 任意位置に行追加
  const handleAddRow = (i) => {
    setQs(prev => [...prev.slice(0, i+1), '', ...prev.slice(i+1)])
  }

  // 任意行を削除
  const handleDelRow = (i) => {
    setQs(prev => prev.filter((_, idx) => idx !==i))
  }

  // 質問一覧登録
  const handleEntry = async () => {
    // 入力チェック


    try {
      const res = await qsEntry({ 'theme': theme_id, 'qs': qs.map((text, i) => ({ sort: i + 1, text: text })) })
      setApiRes('登録完了しました')
    } catch (err) {
      setApiRes('登録失敗しました')
    }
  }

  // フェードインアニメーション
  useFadeIn(init)

  return (
    <section className='client_qs'>
      <div className='section_cont'>
        <h2 className='fade_in'>質問設定</h2>

        {/* 質問リスト */}
        <table className='fade_in'>
          <thead>
            <tr><td>No</td><td>質問</td></tr>
          </thead>
          <tbody>
            {qs.map((text, i) => (
              <React.Fragment key={i}>
                <tr className='quest_row'>
                  <td>{i+1}</td>
                  <td>
                    <textarea value={text} rows={1} onChange={e => setQs(prev => prev.map((t, idx) => idx === i ? e.target.value : t))} />
                    <button className='btn_del' onClick={() => handleDelRow(i)}>×</button>
                  </td>
                </tr>
                <tr className='add_row'>
                  <td colSpan={2}>
                    <button className='btn_add' onClick={() => handleAddRow(i)}>+ ここに追加</button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className='btns fade_in'>
          <button className='btn_cancel' onClick={() => setQs([''])}>全削除</button>
          <button className='btn_back' onClick={() => setQs(init)}>リセット</button>
        </div>

        <div className='btns_trans fade_in'>
          <button className='btn_pre' onClick={() => navigate(-1)}>戻る</button>
          <button className='btn_nxt' onClick={handleEntry}>登録</button>
        </div>

        {apiRes &&
          <p className='qs_res'>{apiRes}</p>
        }
      </div>
    </section>
  )
}
