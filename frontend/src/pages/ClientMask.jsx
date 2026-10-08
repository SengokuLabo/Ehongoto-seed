import { useLocation, useNavigate } from 'react-router-dom'
import { useFadeIn } from '../hooks/useFadeIn'
import { useEffect, useRef, useState } from 'react'
import { maskUpload } from '../api/client'
import Modal from '../components/Modal'
import { drawFace } from '../utils/drawFace'
import { drawSpread } from '../utils/drawSpread'


// テーマ用イラスト登録
export default function ClientMask() {
  const navigate = useNavigate()

  const { state } = useLocation()
  const img = state?.img
  const themes = state?.themes ?? []
  const faceParts = themes.find(t => img?.themes?.includes(t.id) && t.hair)
  const faceAngles = faceParts?.angles ?? []

  const autoFace = themes.filter(t => img?.themes?.includes(t.id)).some(t => t.hair)
  const face = { hair: 0, eye: 0, nose: 0, mouth: 0, hairColor: '#1a1a1a', skinColor: '#f0c08a' }

  const [coverLeft, setCoverLeft] = useState(30)
  const [tz1, setTz1] = useState({ t: 12, l: 8, w: 35, h: 13 })
  const [tz2, setTz2] = useState({ t: 72, l: 60, w: 35, h: 13 })
  const [tz2On, setTz2On] = useState(false)
  const [hasFace, setHasFace] = useState(autoFace)
  const [faceDot, setFaceDot] = useState({ t: 38, l: 60 })
  const [size, setSize] = useState(img?.size ?? 30)
  const [ox, setOx] = useState(img?.ox ?? 0)
  const [tilt, setTilt] = useState(img?.tilt ?? 0)
  const [detail, setDetail] = useState(null)
  const [angleIdx, setAngleIdx] = useState(() => {
    const i = faceAngles.indexOf(img?.angle ?? 0)
    return i >= 0 ? i : 0
  })
  const angle = faceAngles[angleIdx] ?? 0

  const canvasRef = useRef(null)
  const imgSizeRef = useRef({ w: 1412, h: 1000 })
  const dragRef = useRef(null)
  const faceRef = useRef(null)
  const spPrevRef = useRef(null)
  const covPrevRef = useRef(null)

  // バリデーション
  const CENTER = 50
  const invalid = (tz1.l < CENTER && tz1.l + tz1.w > CENTER) || (tz2On && tz2.l < CENTER && tz2.l + tz2.w > CENTER)

  // イラストサイズ取得
  useEffect(() => {
    if (!img?.path) return
    const el = new Image()
    el.onload = () => { imgSizeRef.current = { w: el.naturalWidth, h: el.naturalHeight } }
    el.src = img.path
  }, [])

  // ドラッグロジック
  useEffect(() => {
    const onMove = e => {
      if (!dragRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const { type, sx, sy, sv } = dragRef.current
      const dx = (e.clientX - sx) / rect.width * 100
      const dy = (e.clientY - sy) / rect.height * 100
      // 表紙領域
      if (type === 'cover') setCoverLeft(v => Math.max(.1, Math.min(50, sv + dx)))
      // テキストエリア1
      if (type === 'tz1_drag') setTz1(s => ({ ...s, l: Math.max(0, Math.min(100 - s.w, sv.l + dx)), t: Math.max(0, Math.min(100 - s.h, sv.t + dy)) }))
      if (type === 'tz1_size') setTz1(s => ({ ...s, w: Math.max(8, sv.w + dx), h: Math.max(4, sv.h + dy) }))
      // テキストエリア2
      if (type === 'tz2_drag') setTz2(s => ({ ...s, l: Math.max(0, Math.min(100 - s.w, sv.l + dx)), t: Math.max(0, Math.min(100 - s.h, sv.t + dy)) }))
      if (type === 'tz2_size') setTz2(s => ({ ...s, w: Math.max(8, sv.w + dx), h: Math.max(4, sv.h + dy) }))
      // 顔位置
      if (type === 'face') setFaceDot({ l: Math.max(0, Math.min(100, sv.l + dx)), t: Math.max(0, Math.min(100, sv.t + dy)) })
    }
    const onUp = () => { dragRef.current = null; document.body.style.cursor = '' }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  // 顔パーツ描写
  useEffect(() => {
    if (!hasFace || !faceParts || !faceRef.current || !canvasRef.current) return
    const draw = async () => {
      const cv = faceRef.current
      const rect = canvasRef.current.getBoundingClientRect()
      cv.width = rect.width
      cv.height = rect.height
      const ctx = cv.getContext('2d')
      ctx.clearRect(0, 0, cv.width, cv.height)
      const scale = cv.width / 720
      const cx = faceDot.l / 100 * cv.width
      const cy = faceDot.t / 100 * cv.height
      const faceP = {
        hair:  [{ id: 0, img_path: faceParts.hair }],
        eye:   [{ id: 0, img_path: faceParts.eye, eye_turn: faceParts.turn }],
        nose:  [{ id: 0, img_path: faceParts.nose }],
        mouth: [{ id: 0, img_path: faceParts.mouth }],
      }
      await drawFace(ctx, cx, cy, size * scale, face, faceP, ox * scale, tilt, angle)
    }
    draw()
  }, [hasFace, faceParts, faceDot, size, angle, ox, tilt])

  // マスク画像生成
  const maskMake = () => {
    const { w: W, h: H } = imgSizeRef.current
    const cv = document.createElement('canvas')
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    // テキストエリア
    ctx.fillStyle = '#FFF'
    ctx.fillRect(tz1.l / 100 * W, tz1.t / 100 * H, tz1.w / 100 * W, tz1.h / 100 * H)
    if (tz2On) ctx.fillRect(tz2.l / 100 * W, tz2.t / 100 * H, tz2.w / 100 * W, tz2.h / 100 * H)
    // 表紙領域
    ctx.fillStyle = '#000'
    ctx.fillRect(coverLeft / 100 * W - 2, 0, 4, H)
    // 顔位置
    if (hasFace) {
      ctx.fillStyle = '#00FF00'
      ctx.beginPath()
      ctx.arc(faceDot.l / 100 * W, faceDot.t / 100 * H, 12, 0, Math.PI * 2)
      ctx.fill()
    }
    return new Promise(resolve => cv.toBlob(resolve, 'image/png'))
  }

  // プレビュー表示
  const handlePreview = async () => {
    const blob = await maskMake()
    const blobPath = URL.createObjectURL(blob)
    try {
      const mockImg = { img_path: img.path, mask_path: blobPath, angle, size, ox, tilt }
      const faceP = hasFace && faceParts ? {
        hair: [{ id: 0, img_path: faceParts.hair }],
        eye: [{ id: 0, img_path: faceParts.eye, eye_turn: faceParts.turn }],
        nose: [{ id: 0, img_path: faceParts.nose }],
        mouth: [{ id: 0, img_path: faceParts.mouth }],
      } : null
      await Promise.all([
        // 見開き
        drawSpread(spPrevRef.current, { sp_num: 1, img: mockImg, text1: '空を見上げたら きれいな虹が見えた', text2: '手を伸ばしたら 届きそう' }, face, faceP, false),
        // 表紙
        drawSpread(covPrevRef.current, { sp_num: 0, img: mockImg, text1: '虹のその向こうに', text2: '' }, face, faceP, false),
      ])
    } finally {
      URL.revokeObjectURL(blobPath)
    }
  }

  // 保存処理
  const handleUpload = async () => {
    try {
      const blob = await maskMake()
      const stem = img.path.split('/').pop().replace(/\.[^.]+$/, '')
      const fd = new FormData()
      fd.append('mask', blob, `${stem}_mask.png`)
      fd.append('id', img.id)
      fd.append('angle', angle)
      fd.append('size', size)
      fd.append('ox', ox)
      fd.append('tilt', tilt)
      await maskUpload(fd)
      setDetail(
        <div>
          <p>マスク画像登録完了しました</p>
          <button className='btn_driv' onClick={() => navigate('/client/img')}>完了</button>
        </div>
      )
    } catch (err) {
      setDetail(`保存に失敗しました：${err.error || err.message}`)
    }
  }

  // フェードインアニメーション
  useFadeIn()

  return (
    <section className='client_mask'>
      <div className='section_cont'>
        <h2 className='fade_in'>マスク編集</h2>
        <h3 className='fade_in'>{img?.name}</h3>

        <div className='mask_layout fade_in'>
          <div className='canvas_wrap'>
            <p>ドラッグで調整</p>
            <div className='canvas_area' ref={canvasRef}>
              {/* イラスト */}
              <img className='canvas_bg' src={img?.path} alt={img?.name} draggable={false} />

              {/* 表紙ゾーン */}
              <div className='cover_zone' style={{ width: `${coverLeft}%` }}>
                <span className='cover_label'>表紙</span>
              </div>

              {/* 表紙線 */}
              <div className='cover_line' style={{ left: `${coverLeft}%` }} onMouseDown={e => {
                dragRef.current = { type: 'cover', sx: e.clientX, sv: coverLeft }
                document.body.style.cursor = 'ew-resize'
                e.preventDefault()
              }}>
                <span>← 表紙線</span>
              </div>

              {/* センター線 */}
              <div className='center_line'>
                <span>← 中心線</span>
              </div>

              {/* テキストゾーン */}
              <div className={`text_zone ${invalid && tz1.l < CENTER && tz1.l + tz1.w > CENTER ? 'invalid' : ''}`}
                style={{ left: `${tz1.l}%`, top: `${tz1.t}%`, width: `${tz1.w}%`, height: `${tz1.h}%` }}
                onMouseDown={e => {
                  if (e.target.classList.contains('tz_resize')) return
                  dragRef.current = { type: 'tz1_drag', sx: e.clientX, sy: e.clientY, sv: { ...tz1 } }
                  e.preventDefault()
                }}
              >
                <span className='tz_label'>テキスト①</span>
                <div className='tz_resize' onMouseDown={e => {
                  dragRef.current = { type: 'tz1_size', sx: e.clientX, sy: e.clientY, sv: { ...tz1 } }
                  e.stopPropagation(); e.preventDefault()
                }}/>
              </div>
              {tz2On && (
                <div className={`text_zone ${invalid && tz2.l < CENTER && tz2.l + tz2.w > CENTER ? 'invalid' : ''}`}
                  style={{ left: `${tz2.l}%`, top: `${tz2.t}%`, width: `${tz2.w}%`, height: `${tz2.h}%` }}
                  onMouseDown={e => {
                    if (e.target.classList.contains('tz_resize')) return
                    dragRef.current = { type: 'tz2_drag', sx: e.clientX, sy: e.clientY, sv: { ...tz2 } }
                    e.preventDefault()
                  }}
                >
                  <span className='tz_label'>テキスト②</span>
                  <div className='tz_resize' onMouseDown={e => {
                    dragRef.current = { type: 'tz2_size', sx: e.clientX, sy: e.clientY, sv: { ...tz2 } }
                    e.stopPropagation(); e.preventDefault()
                  }}/>
                </div>
              )}

              {/* 顔位置 */}
              {hasFace && (
                <>
                  <canvas ref={faceRef}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
                  <div className='face_handle'
                    style={{ left: `${faceDot.l}%`, top: `${faceDot.t}%` }}
                    onMouseDown={e => {
                      dragRef.current = { type: 'face', sx: e.clientX, sy: e.clientY, sv: { ...faceDot } }
                      e.preventDefault()
                    }}
                  />
                </>
              )}
            </div>

            {hasFace && <p>※ 顔を反転させるには、パーツ位置を変更してください</p>}
          </div>

          {/* コントロール */}
          <div className='ctrls'>
            {/* テキストエリア */}
            <div className='ctrl_card'>
              <h4>テキストエリア</h4>
              <div className='tz_row'>
                <span>テキスト①</span>
                <span>必須</span>
              </div>
              <div className='tz_row'>
                <span>テキスト②</span>
                <label className='toggle'>
                  <input type='checkbox' checked={tz2On} onChange={e => setTz2On(e.target.checked)} />
                  <span className='toggle_slider' />
                </label>
              </div>
            </div>

            {/* 顔設定 */}
            <div className='ctrl_card'>
              <div className='ctrl_head'>
                <h4>顔設定</h4>
                <label className='toggle'>
                  <input type='checkbox' checked={hasFace} onChange={e => setHasFace(e.target.checked)} />
                  <span className='toggle_slider' />
                </label>
              </div>
              {hasFace && (
                <div>
                  {/* 角度 */}
                  <div className='slider'>
                    <div className='slider_head'><span className='slider_label'>角度</span><span className='slider_val'>{angle}°</span></div>
                    <input type='range' min='0' max={faceAngles.length - 1} value={angleIdx} onChange={e => setAngleIdx(Number(e.target.value))} />
                    <div className='slider_range'><span>{faceAngles[0]}°</span><span>{faceAngles[faceAngles.length - 1]}°</span></div>
                  </div>
                  {/* サイズ */}
                  <div className='slider'>
                    <div className='slider_head'><span className='slider_label'>サイズ</span><span className='slider_val'>{size}</span></div>
                    <input type='range' min='10' max='200' value={size} onChange={e => setSize(Number(e.target.value))} />
                    <div className='slider_range'><span>10</span><span>200</span></div>
                  </div>
                  {/* パーツ位置 */}
                  <div className='slider'>
                    <div className='slider_head'><span className='slider_label'>パーツ位置</span><span className='slider_val'>{ox}</span></div>
                    <input type='range' min='-100' max='100' value={ox} onChange={e => setOx(Number(e.target.value))} />
                    <div className='slider_range'><span>-100</span><span>0</span><span>100</span></div>
                  </div>
                  {/* 傾き */}
                  <div className='slider'>
                    <div className='slider_head'><span className='slider_label'>傾き</span><span className='slider_val'>{tilt}°</span></div>
                    <input type='range' min='-45' max='45' value={tilt} onChange={e => setTilt(Number(e.target.value))} />
                    <div className='slider_range'><span>-45</span><span>0</span><span>45</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className='btns fade_in'>
          <button className='btn_back' onClick={() => navigate('/client/img')}>戻る</button>
          <button className='btn_driv' onClick={handleUpload} disabled={invalid}>確定</button>
        </div>

        {/* エラー */}
        {invalid && <p className='error'>テキストエリアが、センター線をまたいでいます</p>}

        {/* プレビュー */}
        <div className='prev_cont fade_in'>
          <button className='btn_dl' onClick={handlePreview}>プレビュー更新</button>
          <div className='prev_wrap'>
            <div className='prev_item prev_sp'>
              <h4>見開き</h4>
              <canvas ref={spPrevRef} width={706} height={500} />
            </div>
            <div className='prev_item prev_cov'>
              <h4>表紙</h4>
              <canvas ref={covPrevRef} width={353} height={500} />
            </div>
          </div>
        </div>

        {/* 結果 */}
        {detail &&
          <Modal title='登録結果' onClose={() => setDetail(null)} cont={detail} />
        }
      </div>
    </section>
  )
}
