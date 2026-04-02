'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'

interface VirtualizedListProps {
  items: any[]
  renderItem: (item: any, index: number) => ReactNode
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function VirtualizedList({ 
  items, 
  renderItem, 
  itemHeight, 
  containerHeight, 
  overscan = 3 
}: VirtualizedListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )
  
  const visibleItems = items.slice(startIndex, endIndex)
  const offsetY = startIndex * itemHeight
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }
  
  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflowY: 'auto' }}
      className="scroll-smooth"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', width: '100%' }}>
          {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        </div>
      </div>
    </div>
  )
}
