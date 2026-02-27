import { memo, useMemo } from 'react';

interface PooCleanEffectProps {
  x: number;
  y: number;
}

export const PooCleanEffect = memo(function PooCleanEffect({ x, y }: PooCleanEffectProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 10 + Math.random() * 10;
        return {
          key: i,
          tx: Math.cos(angle) * dist,
          ty: Math.sin(angle) * dist,
          size: 2 + Math.random() * 2,
          delay: Math.random() * 0.05,
          color: i % 2 === 0 ? '#fef08a' : '#a3e635',
        };
      }),
    [],
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 20,
        animation: 'poo-clean-fade 0.5s ease-out forwards',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 3px ${p.color}`,
            animation: `poo-clean-particle 0.4s ease-out ${p.delay}s forwards`,
            '--clean-tx': `${p.tx}px`,
            '--clean-ty': `${p.ty}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});
