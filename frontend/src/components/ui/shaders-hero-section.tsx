"use client"

import { MeshGradient } from "@paper-design/shaders-react"
import React, { useEffect, useRef, useState } from "react"

interface ShaderBackgroundProps {
  children: React.ReactNode
}

export function ShaderBackground({ children }: ShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const handleMouseEnter = () => setIsActive(true)
    const handleMouseLeave = () => setIsActive(false)

    const container = containerRef.current
    if (container) {
      container.addEventListener("mouseenter", handleMouseEnter)
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    return () => {
      if (container) {
        container.removeEventListener("mouseenter", handleMouseEnter)
        container.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="min-h-[100dvh] w-full relative overflow-hidden bg-black isolate">
      {/* SVG Filters */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter id="gooey-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {isActive ? null : null}

      {/* Background Shaders */}
      <div className="absolute inset-0 -z-10 bg-black">
          <MeshGradient
            className="absolute inset-0 w-full h-full"
            colors={["#000000", "#1E3A8A", "#0F172A", "#3B82F6", "#020617"]}
            speed={0.15}
          />
          <MeshGradient
            className="absolute inset-0 w-full h-full mix-blend-overlay opacity-60 pointer-events-none"
            colors={["#000000", "#ffffff", "#1E3A8A", "#000000"]}
            speed={0.1}
          />
      </div>
      <div className="relative z-10 w-full h-full">
         {children}
      </div>
    </div>
  )
}


export function HeroContent({ children }: { children?: React.ReactNode }) {
  return (
    <main className="flex flex-col items-center justify-center min-h-[90dvh] text-center pt-20 px-6 max-w-4xl mx-auto">

      {/* Main Heading */}
      <h1 className="text-5xl md:text-7xl font-light text-white mb-6 tracking-tight">
        <span className="font-semibold italic">Premium</span> E-Commerce
        <br />
        <span className="font-light text-white/90">Experience</span>
      </h1>

      {/* Description */}
      <p className="text-lg md:text-xl font-light text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
        Discover our curated collection of high-quality products. Shop the best items with unmatched style and ease.
      </p>

      {children}
    </main>
  )
}
