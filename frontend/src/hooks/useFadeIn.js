import { useEffect } from 'react';

// フェードインフック
export function useFadeIn(ready = true, resetDelay = false, instant = false) {
  useEffect(() => {
    if (!ready) return

    let delayIdx = 0
    document.querySelectorAll('.fade_in').forEach(el => {
      // すでにフェードイン済み要素をリセット
      el.classList.remove('visible')

      // delay要素をリセット
      if (resetDelay) {
        el.className = el.className.replace(/\bdelay\d+\b/g, '').trim()
      }

      const rect = el.getBoundingClientRect()

      if (instant) {
        if (rect.top < window.innerHeight) el.classList.add('visible')
        return
      }

      // ファーストビューにdelayを自動割り振り
      if (rect.bottom < 0) {
        el.classList.add('visible')
      } else if (rect.top < window.innerHeight) {
        el.classList.add(`delay${delayIdx++}`)
      }
    })

    // スクロールでフェードイン
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    document.querySelectorAll('.fade_in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [ready])
}
