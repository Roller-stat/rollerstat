import { useEffect } from 'react'
import { useUIStore } from '@/lib/stores'
import { useHydration } from './useHydration'

export function useQuotesCarousel(quotesLength: number) {
  const { currentQuote, setCurrentQuote, isCarouselAutoPlay } = useUIStore()
  const isHydrated = useHydration()

  useEffect(() => {
    if (!isHydrated || !isCarouselAutoPlay || quotesLength <= 1) return
    
    const interval = setInterval(() => {
      setCurrentQuote((currentQuote + 1) % quotesLength)
    }, 5000) // Change quote every 5 seconds

    return () => clearInterval(interval)
  }, [currentQuote, quotesLength, setCurrentQuote, isCarouselAutoPlay, isHydrated])

  return { currentQuote, setCurrentQuote, isHydrated }
}
