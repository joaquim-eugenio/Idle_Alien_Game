import { memo, useMemo } from 'react';

interface FartEffectProps {
  x: number;
  y: number;
  facingAngle: number;
  color: string;
}

const FART_DURATION = 1.2;

export const FartEffect = memo(function FartEffect({ x, y, facingAngle, color }: FartEffectProps) {
  const behindAngle = facingAngle + Math.PI;

  const puffs = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const spread = (Math.random() - 0.5) * 1.4;
      const angle = behindAngle + spread;
      const dist = 14 + Math.random() * 24;
      const size = 10 + Math.random() * 14;
      return {
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        size,
        delay: i * 0.05 + Math.random() * 0.04,
        duration: FART_DURATION * (0.7 + Math.random() * 0.3),
      };
    }), [behindAngle]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        zIndex: 4,
        animation: `fart-fade ${FART_DURATION}s ease-out forwards`,
        contain: 'layout style',
      }}
    >
      {puffs.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size * 1.5,
            height: p.size * 1.5,
            left: -p.size * 0.75,
            top: -p.size * 0.75,
            background: `radial-gradient(circle, ${color}66 0%, ${color}33 30%, ${color}11 60%, transparent 80%)`,
            animation: `fart-puff ${p.duration}s ease-out ${p.delay}s forwards`,
            '--fart-tx': `${p.tx}px`,
            '--fart-ty': `${p.ty}px`,
            opacity: 0,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
});
