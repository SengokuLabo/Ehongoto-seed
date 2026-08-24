

// モーダル コンポーネント
export default function Modal({ onClose, title, cont }) {
  return (
    <div
      className='modal_bk'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label={title}
    >
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        <button className='modal_close' onClick={onClose} aria-label='閉じる'>✖︎</button>
        <h2>{title}</h2>
        {cont}
      </div>
    </div>
  )
}
