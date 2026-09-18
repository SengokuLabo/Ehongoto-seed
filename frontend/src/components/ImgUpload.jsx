import { useEffect, useRef, useState } from 'react'

// 画像アップロード コンポーネント
export default function ImgUpload({ label, dir, img, onSave }) {
  const previewRef = useRef(null)
  const [preview, setPreview] = useState(null)

  // アンマウント時にObjectURLを解放
  useEffect(() => {
    return () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current) }
  }, [])

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    const url = URL.createObjectURL(file)
    previewRef.current = url
    setPreview(url)
    onSave(file)
  }

  const imgSrc = preview ?? (img ? `/media/${dir}/${img}` : null)

  return (
    <div className='img_upload'>
      <div className='img'>
        {imgSrc
          ? <img src={imgSrc} alt={img} />
          : <div className='img_upload_empty'>画像未設定</div>
        }
      </div>
      <label className='btn_driv'>
        {label}
        <input type='file' accept='image/*' onChange={handleChange} />
      </label>
    </div>
  )
}
