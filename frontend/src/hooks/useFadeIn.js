import { useEffect } from 'react';

// フェードインフック
export function useFadeIn(ready = true, resetDelay = false) {
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

      // ファーストビューにdelayを自動割り振り
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight) {
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
