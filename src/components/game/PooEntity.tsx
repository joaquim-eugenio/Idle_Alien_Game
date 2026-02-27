import { memo, useMemo } from 'react';
import type { Poo } from '../../lib/types';

interface PooEntityProps {
  poo: Poo;
}

export const PooEntity = memo(function PooEntity({ poo }: PooEntityProps) {
  const stinkWaves = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        key: i,
        xOff: -6 + i * 6,
        delay: i * 0.4,
      })),
    [],
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: poo.x,
        top: poo.y,
        animation: 'poo-appear 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        zIndex: 6,
        pointerEvents: 'none',
      }}
    >
      {stinkWaves.map((wave) => (
        <div
          key={wave.key}
          style={{
            position: 'absolute',
            left: `calc(50% + ${wave.xOff}px)`,
            bottom: 13,
            width: 2,
            height: 13,
            borderRadius: 2,
            background: 'rgba(140, 180, 40, 0.7)',
            animation: `poo-stink 1.2s ease-in-out ${wave.delay}s infinite`,
            transformOrigin: 'bottom center',
          }}
        />
      ))}

      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #8B6914, #5C3D00)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 -2px 3px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: 4,
            width: 4,
            height: 3,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
          }}
        />
      </div>
    </div>
  );
});
