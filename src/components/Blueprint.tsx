/** Technical-drawing style gear outlines used as subtle background art. */

function gearPath(cx: number, cy: number, teeth: number, rOuter: number, rRoot: number) {
  const pts: string[] = []
  const step = (Math.PI * 2) / teeth
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const p = [
      [rRoot, a],
      [rOuter, a + step * 0.15],
      [rOuter, a + step * 0.45],
      [rRoot, a + step * 0.6],
    ]
    for (const [r, t] of p) pts.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`)
  }
  return `M${pts.join('L')}Z`
}

interface GearDrawingProps {
  className?: string
  teeth?: number
}

export function GearDrawing({ className, teeth = 36 }: GearDrawingProps) {
  const c = 300
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <path d={gearPath(c, c, teeth, 270, 250)} strokeWidth="1.2" />
      <circle cx={c} cy={c} r={232} strokeWidth="0.8" />
      <circle cx={c} cy={c} r={260} strokeWidth="0.6" strokeDasharray="10 4 2 4" />
      <circle cx={c} cy={c} r={150} strokeWidth="1" />
      <circle cx={c} cy={c} r={70} strokeWidth="1.2" />
      <rect x={c - 10} y={c - 82} width="20" height="16" strokeWidth="1" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i * Math.PI) / 3
        return <circle key={i} cx={c + 110 * Math.cos(a)} cy={c + 110 * Math.sin(a)} r={16} strokeWidth="0.9" />
      })}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i * Math.PI) / 3 + Math.PI / 6
        return (
          <line
            key={i}
            x1={c + 76 * Math.cos(a)}
            y1={c + 76 * Math.sin(a)}
            x2={c + 228 * Math.cos(a)}
            y2={c + 228 * Math.sin(a)}
            strokeWidth="0.8"
          />
        )
      })}
      <line x1="0" y1={c} x2="600" y2={c} strokeWidth="0.6" strokeDasharray="18 5 3 5" />
      <line x1={c} y1="0" x2={c} y2="600" strokeWidth="0.6" strokeDasharray="18 5 3 5" />
      <path d={`M${c} ${c} L${c + 250 * Math.cos(-0.5)} ${c + 250 * Math.sin(-0.5)}`} strokeWidth="0.7" />
      <path d={`M${c + 230 * Math.cos(-0.5)} ${c + 230 * Math.sin(-0.5)} l-14 2 l6 -12 z`} strokeWidth="0.7" />
    </svg>
  )
}

export function WormDrawing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 220" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <rect x="10" y="88" width="120" height="44" strokeWidth="1" />
      <rect x="510" y="88" width="120" height="44" strokeWidth="1" />
      <rect x="130" y="60" width="380" height="100" strokeWidth="1.1" />
      {Array.from({ length: 9 }).map((_, i) => (
        <path key={i} d={`M${150 + i * 40} 60 q20 50 0 100`} strokeWidth="0.9" />
      ))}
      <line x1="0" y1="110" x2="640" y2="110" strokeWidth="0.6" strokeDasharray="18 5 3 5" />
      <path d="M60 40 v40 m-6 -10 l6 10 l6 -10" strokeWidth="0.8" />
      <path d="M580 180 v-40 m-6 10 l6 -10 l6 10" strokeWidth="0.8" />
    </svg>
  )
}
