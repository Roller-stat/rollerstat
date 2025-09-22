import { useEffect, useRef } from 'react'
import { useUIStore } from '@/lib/stores'
import { useHydration } from './useHydration'

export function useVideoRotation(videos: string[]) {
  const { currentVideoIndex, setCurrentVideoIndex } = useUIStore()
  const isHydrated = useHydration()
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (!isHydrated || videos.length <= 1) return

    const videoElement = document.querySelector('video')
    if (!videoElement) return

    const handleVideoEnd = () => {
      setCurrentVideoIndex((currentVideoIndex + 1) % videos.length)
    }

    const handleLoadedMetadata = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      const duration = videoElement.duration * 1000
      timeoutRef.current = setTimeout(() => {
        setCurrentVideoIndex((currentVideoIndex + 1) % videos.length)
      }, duration)
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('ended', handleVideoEnd)

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('ended', handleVideoEnd)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [currentVideoIndex, videos.length, setCurrentVideoIndex, isHydrated])

  return { currentVideoIndex, setCurrentVideoIndex }
}
