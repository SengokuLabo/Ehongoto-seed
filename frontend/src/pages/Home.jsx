import { useEffect, useState } from 'react'
import { getHome } from '../api/client'
import { useNavigate } from 'react-router-dom'
import BookPreview from '../components/BookPreview'
import { mockData } from '../mock'
import WaitModal from '../components/WaitModal'
import { useFadeIn } from '../hooks/useFadeIn'

// ホーム
export default function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [themes, setThemes] = useState([])
  const [clients, setClients] = useState([])
  const [pPdf, setPPdf] = useState(0)
  const [pSoft, setPSoft] = useState(0)
  const [pHard, setPHard] = useState(0)

  // プレビュー用
  const W = Math.min(Math.floor(window.innerWidth * 0.90), 720)
  const spreads = mockData?.spreads ?? []
  const face = mockData?.face ?? []
  const faceParts = mockData?.face_parts ?? []

  // ホーム情報取得
  useEffect(() => {
    (async () => {
      try {
        const res = await getHome()
        setThemes(res.themes)
        setClients(res.clients)
        setPPdf(res.price_pdf)
        setPSoft(res.price_soft)
        setPHard(res.price_hard)

        // 待機時間
        await new Promise(r => setTimeout(r, 1200))
      } catch (err) {
        console.log(err)
      }
      setLoading(false)
    })()
  }, [])

  // ロード後にフェードインアニメーション追加
  useFadeIn(!loading)

  // テーマ選択
  const handleTheme = (client, theme) => {
    navigate(`/?client=${client}&theme=${theme}`)
  }

  return (
    <main className='home'>
      {/* hero */}
      <section className='home_hero'>
        <div>
          <h1 className='fade_in'>
            あなたの物語を<br />
            世界にひとつの<br />
            絵本に
          </h1>
          <h5 className='fade_in delay1'>質問に答えるだけで<br />AIがあなたの人生を物語にします</h5>
          <button className='fade_in delay2' onClick={() => navigate('/coupon')}>クーポンをお持ちの方はこちら→</button>
        </div>
        {/* プレビュー */}
        <div className='fade_in delay3'>
          <BookPreview spreads={spreads} face={face} faceParts={faceParts} isPreview={false} W={W/1.2} isAuto={true} />
        </div>
      </section>

      {/* steps */}
      <section className='home_steps'>
        <div className='section_cont fade_in'>
          <h1 className='fade_in'>つくり方</h1>
          <p className='fade_in'>たった3ステップで絵本が完成</p>
          <div className='steps'>
            <div className='step fade_in'>
              <div className='icon'>
                <img src='/media/logos/icon_question.png' alt='質問' />
              </div>
              <h5>Step.1</h5>
              <h3>質問に回答</h3>
              <p>用意された質問に<br />自由に回答</p>
            </div>
            <div className='angle fade_in delay1'>＞</div>
            <div className='step fade_in delay2'>
              <div className='icon'>
                <img src='/media/logos/icon_select.png' alt='選択' />
              </div>
              <h5>Step.2</h5>
              <h3>顔・背景を選択</h3>
              <p>物語にマッチする<br />イラストを選択</p>
            </div>
            <div className='angle fade_in delay3'>＞</div>
            <div className='step fade_in delay4'>
              <div className='icon'>
                <img src='/media/logos/icon_ehon.png' alt='絵本' />
              </div>
              <h5>Step.3</h5>
              <h3>絵本が完成</h3>
              <p>PDFダウンロードまたは<br />製本でお届け</p>
            </div>
          </div>
        </div>
      </section>

      {/* themes */}
      <section className='home_themes'>
        <div className='section_cont'>
          <h1 className='fade_in'>テーマを選択</h1>
          <p className='fade_in'>あなたにぴったりなテーマで絵本をつくろう</p>
          <div className='themes'>
            {themes.map((t, i) => (
              <button key={t.client + t.theme} className={`btn_theme fade_in delay${i}`} onClick={() => handleTheme(t.client, t.theme)}>
                <div className='theme_icon'>
                  <img src={t.icon} alt={t.theme} />
                </div>
                <h4>{t.label}</h4>
                <p>{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* clients */}
      <section className='home_clients'>
        <div className='section_cont'>
          <h1 className='fade_in'>導入クライアント</h1>
          <p className='fade_in'>さまざまなシーンで活用されています</p>
          <div className='clients'>
            {clients.map((c, i) => (
              <button key={c.client} className={`btn_client fade_in delay${i}`} onClick={() => navigate(`/?client=${c.client}`)} >
                <div className='logo'>
                  <img src={c.logo} alt={c.client} />
                </div>
                <h3>{c.label}</h3>
                <p>{c.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* sample */}
      <section className='home_sample'>
        <div className='section_cont'>
          <h1 className='fade_in'>完成サンプル</h1>
          <p className='fade_in'>※めくる音がなります</p>
          <div className='fade_in'>
            <BookPreview spreads={spreads} face={face} faceParts={faceParts} isPreview={false} W={W} isAuto={false} />
          </div>
        </div>
      </section>

      {/* price */}
      <section className='home_price'>
        <div className='section_cont'>
          <h1 className='fade_in'>料金</h1>
          <div className='prices'>
            {/* PDF */}
            <div className='price fade_in'>
              <img className='icon' src='/media/logos/icon_pdf.png' alt='PDF' />
              <h4>PDF ダウンロード</h4>
              <h2>¥{pPdf.toLocaleString('ja-JP')}-</h2>
              <p>
                購入後すぐにダウンロード<br />
                有効期限：30日間<br />
                印刷・保存自由
              </p>
            </div>
            {/* ソフトカバー */}
            <div className='price fade_in delay1'>
              <img className='icon' src='/media/logos/icon_ehon.png' alt='絵本' />
              <h4>小冊子製本</h4>
              <h2>¥{pSoft.toLocaleString('ja-JP')}-</h2>
              <p>
                本格的な絵本として製本<br />
                自分用や気軽なプレゼントに最適<br />
                PDF ダウンロードも付属
              </p>
            </div>
            {/* ハードカバー */}
            <div className='price fade_in delay2'>
              <div className='icon'>
                <img src='/media/logos/icon_present.png' alt='プレゼント' />
              </div>
              <h4>ハードカバー製本</h4>
              <h2>¥{pHard.toLocaleString('ja-JP')}-</h2>
              <p>
                さらに本格的な絵本として製本<br />
                大切な人へのプレゼントに最適<br />
                PDF ダウンロードも付属
              </p>
            </div>
          </div>
        </div>
      </section>

      {loading && <WaitModal text={'ロード中'} />}
    </main>
  )
}
