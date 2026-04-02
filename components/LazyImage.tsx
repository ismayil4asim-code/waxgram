'use client'

import { useState, useEffect, useRef } from 'react'
import { FiLoader } from 'react-icons/fi'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  fallback?: string
}

export function LazyImage({ src, alt, className = '', fallback }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && imgRef.current) {
            imgRef.current.src = src
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [src])
  
  const handleLoad = () => {
    setIsLoaded(true)
  }
  
  const handleError = () => {
    setError(true)
  }
  
  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-lg">
          <FiLoader className="animate-spin text-[#2b6bff]" size={24} />
        </div>
      )}
      <img
        ref={imgRef}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={{ display: error ? 'none' : 'block' }}
      />
      {error && fallback && (
        <img src={fallback} alt={alt} className={className} />
      )}
    </div>
  )
}
