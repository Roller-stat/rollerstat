import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  // Navigation
  isMobileMenuOpen: boolean
  activeMenuItem: string
  
  // Hero Section
  currentVideoIndex: number
  
  // Quotes Carousel
  currentQuote: number
  isCarouselAutoPlay: boolean
  
  // Actions
  toggleMobileMenu: () => void
  setActiveMenuItem: (item: string) => void
  setCurrentVideoIndex: (index: number) => void
  setCurrentQuote: (index: number) => void
  setCarouselAutoPlay: (autoPlay: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      isMobileMenuOpen: false,
      activeMenuItem: '/',
      currentVideoIndex: 0,
      currentQuote: 0,
      isCarouselAutoPlay: true,
      
      // Actions
      toggleMobileMenu: () => set((state) => ({ 
        isMobileMenuOpen: !state.isMobileMenuOpen 
      })),
      
      setActiveMenuItem: (item: string) => set({ 
        activeMenuItem: item 
      }),
      
      setCurrentVideoIndex: (index: number) => set({ 
        currentVideoIndex: index 
      }),
      
      setCurrentQuote: (index: number) => set({ 
        currentQuote: index 
      }),
      
      setCarouselAutoPlay: (autoPlay: boolean) => set({ 
        isCarouselAutoPlay: autoPlay 
      }),
    }),
    {
      name: 'ui-store', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        activeMenuItem: state.activeMenuItem,
        isCarouselAutoPlay: state.isCarouselAutoPlay
      }), // only persist these fields
      skipHydration: true, // Prevent hydration mismatch
    }
  )
)

// Hydrate the store on client side
if (typeof window !== 'undefined') {
  useUIStore.persist.rehydrate()
}
