import { memo, useMemo } from 'react';

interface CollisionEffectProps {
  x: number;
  y: number;
  color1: string;
  color2: string;
}

const PARTICLE_SHAPES = ['star', 'bang', 'spiral', 'spark', 'zigzag'] as const;

function Star({ size, color }: { size: number; color: string }) {
  const points = 5;
  const outer = size / 2;
  const inner = outer * 0.4;
  const d = Array.from({ length: points * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI * i) / points - Math.PI / 2;
    return `${outer + r * Math.cos(angle)},${outer + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={d} fill={color} />
    </svg>
  );
}

function Bang({ size, color }: { size: number; color: string }) {
  return (
    <div style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.8, fontWeight: 900, color,
      textShadow: `0 0 3px ${color}`,
      lineHeight: 1,
    }}>!</div>
  );
}

function Spiral({ size, color }: { size: number; color: string }) {
  return (
    <div style={{
      width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.7, color,
      textShadow: `0 0 2px ${color}`,
      lineHeight: 1,
    }}>@</div>
  );
}

function Spark({ size, color }: { size: number; color: string }) {
  return (
    <div style={{
      width: size, height: size * 0.3,
      background: color,
      borderRadius: size * 0.15,
      boxShadow: `0 0 4px ${color}`,
    }} />
  );
}

function Zigzag({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <polyline
        points="2,15 7,5 13,15 18,5"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SHAPE_MAP = { star: Star, bang: Bang, spiral: Spiral, spark: Spark, zigzag: Zigzag } as const;

export const CollisionEffect = memo(function CollisionEffect({ x, y, color1, color2 }: CollisionEffectProps) {
  const particles = useMemo(() =>
    Array.from({ length: 9 }, (_, i) => {
      const angle = (i / 9) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      return {
        angle,
        distance: 18 + Math.random() * 16,
        size: 5 + Math.random() * 5,
        rotation: Math.random() * 360,
        shape: PARTICLE_SHAPES[i % PARTICLE_SHAPES.length],
        color: i % 2 === 0 ? color1 : color2,
        delay: Math.random() * 0.05,
      };
    }), [color1, color2]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, zIndex: 25, contain: 'layout style' }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 16, height: 16,
          left: -8, top: -8,
          background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,200,0.4) 50%, transparent 100%)`,
          animation: 'collision-flash 0.35s ease-out forwards',
        }}
      />

      {particles.map((p, i) => {
        const ShapeComp = SHAPE_MAP[p.shape];
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: -p.size / 2,
              top: -p.size / 2,
              animation: `collision-particle 0.5s ease-out ${p.delay}s forwards`,
              '--col-tx': `${Math.cos(p.angle) * p.distance}px`,
              '--col-ty': `${Math.sin(p.angle) * p.distance}px`,
              '--col-rot': `${p.rotation}deg`,
            } as React.CSSProperties}
          >
            <ShapeComp size={p.size} color={p.color} />
          </div>
        );
      })}
    </div>
  );
});
