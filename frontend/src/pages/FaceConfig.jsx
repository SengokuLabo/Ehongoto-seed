import { useState } from 'react'
import BookCanvas from '../components/BookCanvas'
import { mockData } from '../mock'

const STEP = 1
const ANGLES = ['0deg', '45deg', '135deg', '180deg']
const INIT_CONFIG = {
  size: mockData.images[0].size,
  ox: mockData.images[0].ox,
  oy: mockData.images[0].oy,
  tilt: mockData.images[0].tilt,
}

const face = {
  hair:  mockData.face_parts.hair[0].id,
  eye:   mockData.face_parts.eye[0].id,
  nose:  mockData.face_parts.nose[0].id,
  mouth: mockData.face_parts.mouth[0].id,
}

const hColor = mockData.hair_colors[1].color
const sColor = mockData.skin_colors[1].color

export default function FaceConfig() {
  const [angle, setAngle] = useState('front')
  const [cfg, setCfg] = useState(INIT_CONFIG)

  const spread = {
      ...mockData.spreads[1],
      img: {
        ...mockData.images[0],
        size: cfg.size,
        ox: cfg.ox,
        oy: cfg.oy,
        tilt: cfg.tilt,
      },
    }

  const update = (key, delta) =>
    setCfg(prev => ({ ...prev, [key]: prev[key] + delta }))

  const copyConfig = () => {
    const out = JSON.stringify({ angle, size: cfg.size, tilt: cfg.tilt, offset: { ox: cfg.ox, oy: cfg.oy } }, null, 2)
    navigator.clipboard?.writeText(out)
    alert('クリップボードにコピーしました\n\n' + out)
  }

  const row = (label, value, onMinus, onPlus, minusLabel = '▼', plusLabel = '▲') => (
    <tr>
      <td style={td}>{label}</td>
      <td style={td}><button style={btn} onClick={onMinus}>{minusLabel}</button></td>
      <td style={{ ...td, width: 40, textAlign: 'center' }}>{value}</td>
      <td style={td}><button style={btn} onClick={onPlus}>{plusLabel}</button></td>
    </tr>
  )

  return (
    <div style={{ display: 'flex', gap: 32, padding: 24, fontFamily: 'sans-serif', alignItems: 'flex-start' }}>

      {/* プレビュー */}
      <div>
        <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>プレビュー</p>
        <BookCanvas
          spread={spread}
          face={face}
          faceParts={mockData.face_parts}
          hairColor={hColor}
          skinColor={sColor}
          isPreview={false}
        />
      </div>

      {/* コントロール */}
      <div>
        <p style={{ margin: '0 0 12px', fontWeight: 'bold' }}>顔パーツ設定</p>

        <div style={{ marginBottom: 16 }}>
          <span style={{ marginRight: 8, fontWeight: 'bold' }}>angle:</span>
          {ANGLES.map(a => (
            <button
              key={a}
              onClick={() => setAngle(a)}
              style={{ marginRight: 4, padding: '4px 10px', cursor: 'pointer', background: angle === a ? '#4A7C59' : '#eee', color: angle === a ? '#fff' : '#333', border: 'none', borderRadius: 4 }}
            >{a}</button>
          ))}
        </div>

        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td colSpan={4} style={{ ...td, fontWeight: 'bold', paddingTop: 12 }}>サイズ</td></tr>
            {row('サイズ', cfg.size, () => update('size', -STEP), () => update('size', +STEP))}

            <tr><td colSpan={4} style={{ ...td, fontWeight: 'bold', paddingTop: 16 }}>目+鼻+口 オフセット</td></tr>
            {row('X', cfg.ox, () => update('ox', -STEP), () => update('ox', +STEP), '◀', '▶')}
            {row('Y', cfg.oy, () => update('oy', -STEP), () => update('oy', +STEP))}

            <tr><td colSpan={4} style={{ ...td, fontWeight: 'bold', paddingTop: 16 }}>傾き（度）</td></tr>
            {row('tilt', cfg.tilt, () => update('tilt', -STEP), () => update('tilt', +STEP), '◀', '▶')}
          </tbody>
        </table>

        <button
          onClick={copyConfig}
          style={{ marginTop: 20, padding: '8px 16px', background: '#4A7C59', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          設定をコピー
        </button>

        <pre style={{ marginTop: 16, fontSize: 11, background: '#f5f5f5', padding: 10, borderRadius: 6 }}>
          {JSON.stringify({ angle, size: cfg.size, tilt: cfg.tilt, offset: { ox: cfg.ox, oy: cfg.oy } }, null, 2)}
        </pre>
      </div>
    </div>
  )
}

const td  = { padding: '4px 8px' }
const btn = { width: 32, height: 28, cursor: 'pointer', fontSize: 14 }
