'use client'
import { useState, useEffect } from 'react'

export function AnalogClock() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState<{ h: number; m: number; s: number; dateStr: string; timeStr: string }>({
    h: 0,
    m: 0,
    s: 0,
    dateStr: '',
    timeStr: '',
  })

  useEffect(() => {
    setMounted(true)
    const update = () => {
      const now = new Date()
      // Use Asia/Tashkent
      const timeFmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tashkent',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      })
      const parts = timeFmt.formatToParts(now)
      const h = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10)
      const m = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10)
      const s = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10)

      const dateFmt = new Intl.DateTimeFormat('uz-UZ', {
        timeZone: 'Asia/Tashkent',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })

      const pad = (n: number) => String(n).padStart(2, '0')

      setTime({
        h,
        m,
        s,
        dateStr: dateFmt.format(now),
        timeStr: `${pad(h)}:${pad(m)}:${pad(s)}`,
      })
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/60 border border-darkText/10 backdrop-blur-sm shadow-sm">
        <div className="w-12 h-12 rounded-full border border-darkText/15 animate-pulse bg-cream/50" />
        <div>
          <div className="w-16 h-3 bg-darkText/10 rounded animate-pulse mb-1" />
          <div className="w-20 h-2 bg-darkText/10 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // Calculate angles (degrees)
  const secondDeg = (time.s / 60) * 360
  const minuteDeg = ((time.m + time.s / 60) / 60) * 360
  const hourDeg = (((time.h % 12) + time.m / 60) / 12) * 360

  return (
    <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-white/70 border border-darkText/10 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
      {/* SVG Analog Soat */}
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          {/* Dial background */}
          <circle cx="50" cy="50" r="48" fill="#F8F5EC" stroke="#234B38" strokeWidth="3" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#234B38" strokeWidth="0.5" strokeOpacity="0.2" />

          {/* 12 Hour ticks */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            const isQuarter = i % 3 === 0
            const r1 = isQuarter ? 38 : 41
            const r2 = 45
            const x1 = 50 + r1 * Math.sin(angle)
            const y1 = 50 - r1 * Math.cos(angle)
            const x2 = 50 + r2 * Math.sin(angle)
            const y2 = 50 - r2 * Math.cos(angle)
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#234B38"
                strokeWidth={isQuarter ? 2.5 : 1}
                strokeLinecap="round"
                opacity={isQuarter ? 0.9 : 0.4}
              />
            )
          })}

          {/* Hour hand */}
          <line
            x1="50"
            y1="50"
            x2={50 + 26 * Math.sin((hourDeg * Math.PI) / 180)}
            y2={50 - 26 * Math.cos((hourDeg * Math.PI) / 180)}
            stroke="#234B38"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Minute hand */}
          <line
            x1="50"
            y1="50"
            x2={50 + 36 * Math.sin((minuteDeg * Math.PI) / 180)}
            y2={50 - 36 * Math.cos((minuteDeg * Math.PI) / 180)}
            stroke="#234B38"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Second hand */}
          <line
            x1="50"
            y1="50"
            x2={50 + 40 * Math.sin((secondDeg * Math.PI) / 180)}
            y2={50 - 40 * Math.cos((secondDeg * Math.PI) / 180)}
            stroke="#D9654D"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Center cap */}
          <circle cx="50" cy="50" r="3.5" fill="#D9654D" />
          <circle cx="50" cy="50" r="1.5" fill="#F8F5EC" />
        </svg>
      </div>

      {/* Raqamli vaqt va sana */}
      <div className="flex flex-col">
        <span className="font-mono text-xs font-bold text-darkText tracking-wider tabular-nums leading-tight">
          {time.timeStr}
        </span>
        <span className="text-[11px] font-medium text-mutedText capitalize leading-tight mt-0.5">
          {time.dateStr}
        </span>
      </div>
    </div>
  )
}
