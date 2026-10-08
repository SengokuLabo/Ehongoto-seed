import { useEffect, useState } from 'react'
import { useFadeIn } from '../hooks/useFadeIn'
import { imgGet, imgUpload, themeImgs } from '../api/client'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'

// テーマ用イラスト登録
export default function ClientImg() {
  const navigate = useNavigate()

  const [imgs, setImgs] = useState([])
  const [upImg, setUpImg] = useState(null)
  const [themes, setThemes] = useState([])
  const [detail, setDetail] = useState(null)
  const [onTheme, setOnTheme] = useState(null)
  const [selTheme, setSelTheme] = useState([])

  useEffect(() => {
    (async () => {
      try {
        // イラスト一覧取得
        const res = await imgGet()
        setImgs(res.imgs)
        setThemes(res.themes)
        setOnTheme(res.themes[0]?.id ?? null)
      } catch (err) {
        setDetail(`情報取得に失敗しました：${err.error || err.message}` )
      }
    })()
  }, [])

  // イラスト登録
  const handleImg = async (img) => {
    if (!img) return
    try {
      const fd = new FormData()
      fd.append('img', img)
      fd.append('themes', JSON.stringify(selTheme))
      const res = await imgUpload(fd)
      setImgs(prev => [...prev, {
        id: res.id,
        path: res.path,
        name: img.name,
        angle: 0, size: 0, ox: 0, tilt: 0,
        mask: false,
        themes: selTheme,
      }])
      setUpImg(null)
      setSelTheme([])
    } catch (err) {
      setDetail(`イラスト登録に失敗しました：${err.error || err.message}` )
    }
  }

  // テーマ紐付け切り替え
  const handleSwitch = (id) => {
    setImgs(prev => prev.map(img =>
      img.id === id
        ? { ...img, themes: img.themes.includes(onTheme)
            ? img.themes.filter(t => t !== onTheme)
            : [...img.themes, onTheme] }
        : img
    ))
  }

  // テーマ紐付け登録
  const handleEntry = async () => {
    try {
      await themeImgs({
        theme: onTheme,
        imgs: imgs.filter(img => img.themes.includes(onTheme)).map(img => img.id)
      })
      setDetail('イラストの紐付け完了しました')
    } catch (err) {
      setDetail(`登録に失敗しました：${err.error || err.message}` )
    }
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='client_img'>
      <div className='section_cont'>
        <h2 className='fade_in'>イラスト管理</h2>

        {/* ファイルアップロード */}
        <label className='img_upload fade_in'>
          <input type='file' accept='image/*' onChange={e => setUpImg(e.target.files[0])} />
          <p>クリックでイメージを登録<br />PNG / JPG</p>
        </label>

        {/* イラスト一覧 */}
        <h3 className='fade_in'>イラスト一覧 <span className='check_info'><div className='check' /> : マスク登録済み</span></h3>
        <div className='img_conts fade_in'>
          {imgs.map(img => (
            <div key={img.id} className='img_cont'>
              <div className='img'>
                <img src={img.path} alt={img.name} />
              </div>
              <p>{img.name}</p>
              <button className='btn_mask' onClick={() => navigate('/client/mask', { state: { img, themes } })}>マスク編集</button>
              {img.mask && <div className='check' />}
            </div>
          ))}
        </div>

        {/* テーマ紐付け */}
        <h3 className='fade_in'>テーマ紐付け</h3>
        <div className='theme_imgs fade_in'>
          <div className='theme_names'>
            {themes.map(theme => (
              <label key={theme.id} className={`theme_name ${onTheme===theme.id ? 'active' : ''}`} onClick={() => setOnTheme(theme.id)}>{theme.label}</label>
            ))}
          </div>

          <div className='img_conts'>
            {imgs.map(img => (
              <label key={img.id} className='img_cont theme_img' onClick={() => handleSwitch(img.id)}>
                <div className={`img ${img.themes.includes(onTheme) ? 'active' : ''}`}>
                  <img src={img.path} alt={img.name} />
                </div>
                <p>{img.name}</p>
                {img.themes.includes(onTheme) && <div className='check' />}
              </label>
            ))}
          </div>
        </div>

        {/* ボタン */}
        <div className='btns fade_in'>
          <button className='btn_back' onClick={() => navigate('/client')}>戻る</button>
          <button className='btn_driv' onClick={handleEntry}>登録</button>
        </div>
      </div>

      {/* 結果 */}
      {detail &&
        <Modal title='登録結果' onClose={() => setDetail(null)} cont={detail} />
      }

      {/* イラストアップロード直後のテーマ紐付け */}
      {upImg &&
        <Modal title='テーマ紐付け' onClose={() => { setUpImg(null); setSelTheme([]) }} cont={
        <div>
          <h4>紐付けるテーマを選択してください</h4>
          <div className='modal_themes'>
            {themes.map(theme => (
              <label key={theme.id}>
                <input type='checkbox' onChange={() => setSelTheme(prev =>
                  prev.includes(theme.id)
                    ? prev.filter(t => t !== theme.id)
                    : [...prev, theme.id]
                )} />{theme.label}
              </label>
            ))}
          </div>
          <button className='btn_driv' onClick={() => handleImg(upImg)} disabled={selTheme.length === 0}>登録</button>
        </div>} />
      }
    </section>
  )
}
