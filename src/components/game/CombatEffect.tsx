import { memo, useMemo } from 'react';

interface CombatEffectProps {
  x: number;
  y: number;
  color: string;
}

const PARTICLE_COUNT = 10;

export const CombatEffect = memo(function CombatEffect({ x, y, color }: CombatEffectProps) {
  const particles = useMemo(() => {
    const items: Array<{
      angle: number;
      dist: number;
      size: number;
      color: string;
      delay: number;
      duration: number;
      isSlash: boolean;
    }> = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const isSlash = i < 3;
      items.push({
        angle,
        dist: 8 + Math.random() * 16,
        size: isSlash ? 4 + Math.random() * 3 : 2 + Math.random() * 2.5,
        color: isSlash ? '#fff' : i < 6 ? color : '#ff4422',
        delay: Math.random() * 0.06,
        duration: 0.25 + Math.random() * 0.15,
        isSlash,
      });
    }
    return items;
  }, [color]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, zIndex: 25, contain: 'layout style' }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 18,
          height: 18,
          left: -9,
          top: -9,
          background: `radial-gradient(circle, rgba(255,200,100,0.9) 0%, rgba(255,80,30,0.4) 50%, transparent 70%)`,
          animation: 'combat-flash 0.25s ease-out forwards',
        }}
      />
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: p.isSlash ? p.size : p.size,
            height: p.isSlash ? 1.5 : p.size,
            left: p.isSlash ? -p.size / 2 : -p.size / 2,
            top: p.isSlash ? -0.75 : -p.size / 2,
            background: p.color,
            borderRadius: p.isSlash ? '1px' : '50%',
            boxShadow: `0 0 ${p.isSlash ? 2 : 3}px ${p.color}`,
            animation: `combat-particle ${p.duration}s ease-out ${p.delay}s forwards`,
            '--cmb-tx': `${Math.cos(p.angle) * p.dist}px`,
            '--cmb-ty': `${Math.sin(p.angle) * p.dist}px`,
            '--cmb-rot': `${(Math.random() - 0.5) * 720}deg`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});
