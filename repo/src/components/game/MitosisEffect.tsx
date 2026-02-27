import { useMemo } from 'react';

interface MitosisEffectProps {
  x: number;
  y: number;
  color: string;
  childX?: number;
  childY?: number;
}

export function MitosisEffect({ x, y, color, childX, childY }: MitosisEffectProps) {
  const dx = (childX ?? x) - x;
  const dy = (childY ?? y) - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const blobParticles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const pAngle = (i * Math.PI) / 3 + Math.random() * 0.5;
      const pDist = 12 + Math.random() * 10;
      return {
        tx: Math.cos(pAngle) * pDist,
        ty: Math.sin(pAngle) * pDist,
        size: 2 + Math.random() * 2,
        delay: 0.1,
        duration: 0.6 + i * 0.05,
      };
    }), []);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 9,
        animation: 'mitosis-fade 1.2s ease-out forwards',
        contain: 'layout style',
      }}
    >
      {dist > 2 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            height: 4,
            background: `linear-gradient(to right, ${color}88, ${color}44, ${color}88)`,
            borderRadius: '50%',
            transformOrigin: 'left center',
            transform: `rotate(${angle}deg) translateY(-50%)`,
            animation: 'mitosis-bridge 1.0s ease-out forwards',
            '--bridge-w': `${Math.min(dist, 30)}px`,
          } as React.CSSProperties}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`,
          animation: 'mitosis-glow 0.8s ease-out forwards',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: `1.5px solid ${color}66`,
          animation: 'mitosis-ring 0.9s ease-out forwards',
        }}
      />

      {blobParticles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${color} 40%, ${color}88 100%)`,
            borderRadius: '50%',
            animation: `mitosis-blob ${p.duration}s ease-out ${p.delay}s forwards`,
            '--blob-tx': `${p.tx}px`,
            '--blob-ty': `${p.ty}px`,
            opacity: 0,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
