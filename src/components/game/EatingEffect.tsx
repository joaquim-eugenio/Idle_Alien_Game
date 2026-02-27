import { memo } from 'react';

interface EatingEffectProps {
  x: number;
  y: number;
  active: boolean;
  color?: string;
}

const particles = Array.from({ length: 6 }, (_, i) => ({
  angle: (i * 60 * Math.PI) / 180,
  distance: 15 + Math.random() * 10,
  size: 3 + Math.random() * 3,
}));

export const EatingEffect = memo(function EatingEffect({ x, y, active, color = '#39ff14' }: EatingEffectProps) {
  if (!active) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, zIndex: 20, contain: 'layout style' }}
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            boxShadow: `0 0 4px ${color}`,
            animation: 'eat-particle 0.4s ease-out forwards',
            '--eat-tx': `${Math.cos(p.angle) * p.distance}px`,
            '--eat-ty': `${Math.sin(p.angle) * p.distance}px`,
          } as React.CSSProperties}
        />
      ))}
      <div
        className="absolute text-xs font-bold whitespace-nowrap"
        style={{
          color,
          textShadow: `0 0 6px ${color}`,
          left: -5,
          top: -15,
          animation: 'eat-text 0.6s ease-out forwards',
        }}
      >
        +E
      </div>
    </div>
  );
});
