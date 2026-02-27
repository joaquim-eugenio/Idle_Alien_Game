import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Plant } from '../../lib/types';

interface PlantEntityProps {
  plant: Plant;
}

const PLANT_PALETTES = [
  { stem: '#6b21a8', leaf: '#a855f7', glow: '#c084fc', accent: '#e0aaff', tip: '#d8b4fe' },
  { stem: '#0e7490', leaf: '#06b6d4', glow: '#22d3ee', accent: '#67e8f9', tip: '#a5f3fc' },
  { stem: '#9333ea', leaf: '#d946ef', glow: '#f0abfc', accent: '#f5d0fe', tip: '#fae8ff' },
  { stem: '#065f46', leaf: '#10b981', glow: '#34d399', accent: '#6ee7b7', tip: '#a7f3d0' },
  { stem: '#1e3a5f', leaf: '#3b82f6', glow: '#60a5fa', accent: '#93c5fd', tip: '#bfdbfe' },
  { stem: '#9d174d', leaf: '#ec4899', glow: '#f472b6', accent: '#fbcfe8', tip: '#fce7f3' },
  { stem: '#92400e', leaf: '#f59e0b', glow: '#fbbf24', accent: '#fde68a', tip: '#fef3c7' },
  { stem: '#7f1d1d', leaf: '#ef4444', glow: '#f87171', accent: '#fca5a5', tip: '#fecaca' },
  { stem: '#312e81', leaf: '#6366f1', glow: '#818cf8', accent: '#a5b4fc', tip: '#c7d2fe' },
  { stem: '#134e4a', leaf: '#14b8a6', glow: '#2dd4bf', accent: '#5eead4', tip: '#99f6e4' },
] as const;

function SpiralFern({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 15, height: 22 }}>
      <div style={{
        position: 'absolute', width: 1.2, height: 15,
        background: `linear-gradient(to top, ${palette.stem}, ${palette.leaf})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)', borderRadius: 1,
      }} />
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <div style={{
            position: 'absolute', width: 4.5 - i * 0.75, height: 1.5,
            background: palette.leaf,
            left: i % 2 === 0 ? '50%' : undefined,
            right: i % 2 === 1 ? '50%' : undefined,
            top: 3 + i * 3, borderRadius: i % 2 === 0 ? '0 50% 50% 0' : '50% 0 0 50%',
            opacity: 0.8 - i * 0.1, boxShadow: `0 0 2px ${palette.glow}66`,
          }} />
        </div>
      ))}
      <div className="rounded-full" style={{
        position: 'absolute', width: 4, height: 4,
        background: `radial-gradient(circle at 40% 35%, ${palette.tip}, ${palette.glow})`,
        left: '50%', top: 0, transform: 'translateX(-50%)',
        boxShadow: `0 0 4px ${palette.glow}, 0 0 8px ${palette.glow}66`,
        animation: 'biolum-pulse 2.5s ease-in-out infinite',
      }} />
      {[0, 1].map((i) => (
        <div key={`spore-${i}`} className="rounded-full" style={{
          position: 'absolute', width: 1, height: 1, background: palette.accent,
          left: 4 + i * 7, top: 2 + i * 4,
          boxShadow: `0 0 1.5px ${palette.accent}`,
          animation: `spore-float 3s ease-in-out ${i * 1.2}s infinite`, opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

function MushroomCap({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 14, height: 20 }}>
      <div style={{
        position: 'absolute', width: 1.5, height: 11,
        background: `linear-gradient(to top, ${palette.stem}cc, ${palette.leaf})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)', borderRadius: 1,
      }} />
      <div style={{
        position: 'absolute', width: 11, height: 6,
        background: `radial-gradient(ellipse at 50% 80%, ${palette.leaf}, ${palette.stem})`,
        left: '50%', top: 2, transform: 'translateX(-50%)',
        borderRadius: '50% 50% 10% 10%',
        boxShadow: `0 0 5px ${palette.glow}88, inset 0 1.5px 3px rgba(255,255,255,0.1)`,
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-full" style={{
            position: 'absolute', width: 1.5, height: 1.5, background: palette.accent,
            left: `${25 + i * 22}%`, top: `${30 + (i % 2) * 20}%`,
            boxShadow: `0 0 2px ${palette.accent}`,
            animation: `biolum-pulse 2s ease-in-out ${i * 0.5}s infinite`,
          }} />
        ))}
      </div>
      <div style={{
        position: 'absolute', width: 8, height: 2, left: '50%', top: 7.5,
        transform: 'translateX(-50%)',
        background: `radial-gradient(ellipse, ${palette.glow}55 0%, transparent 70%)`,
        borderRadius: '0 0 50% 50%',
      }} />
      {[0, 1, 2].map((i) => (
        <div key={`sp-${i}`} className="rounded-full" style={{
          position: 'absolute', width: 0.75, height: 0.75, background: palette.tip,
          left: 3 + i * 4, top: 9 + i * 1.5,
          boxShadow: `0 0 1.5px ${palette.tip}`,
          animation: `spore-fall 4s ease-in-out ${i * 0.8}s infinite`, opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

function TendrilPlant({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 13, height: 21 }}>
      <div className="rounded-full" style={{
        position: 'absolute', width: 5, height: 4,
        background: `radial-gradient(circle at 45% 40%, ${palette.leaf}, ${palette.stem})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)',
        boxShadow: `0 0 3px ${palette.glow}44`,
      }} />
      {[0, 1, 2].map((i) => {
        const offsets = [-4, 0, 4];
        const heights = [15, 18, 14];
        const rotations = [-12, 0, 10];
        return (
          <div key={i} style={{
            position: 'absolute', width: 1, height: heights[i],
            background: `linear-gradient(to top, ${palette.stem}, ${palette.leaf}88)`,
            left: `calc(50% + ${offsets[i]}px)`, bottom: 2,
            transform: `translateX(-50%) rotate(${rotations[i]}deg)`,
            transformOrigin: 'bottom center', borderRadius: 1,
            animation: `tendril-sway 3s ease-in-out ${i * 0.5}s infinite`,
          }}>
            <div className="rounded-full" style={{
              position: 'absolute', width: 2.5, height: 2.5, top: -1, left: '50%',
              transform: 'translateX(-50%)',
              background: `radial-gradient(circle, ${palette.tip}, ${palette.glow})`,
              boxShadow: `0 0 3px ${palette.glow}, 0 0 6px ${palette.glow}55`,
              animation: `biolum-pulse 2s ease-in-out ${i * 0.7}s infinite`,
            }} />
          </div>
        );
      })}
    </div>
  );
}

function PodPlant({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 12, height: 19 }}>
      <div style={{
        position: 'absolute', width: 1.2, height: 12,
        background: `linear-gradient(to top, ${palette.stem}, ${palette.leaf})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)', borderRadius: 1,
      }} />
      <div style={{
        position: 'absolute', width: 7, height: 9,
        background: `radial-gradient(ellipse at 45% 40%, ${palette.glow}, ${palette.leaf} 60%, ${palette.stem})`,
        left: '50%', top: 0, transform: 'translateX(-50%)',
        borderRadius: '45% 45% 50% 50%',
        boxShadow: `0 0 6px ${palette.glow}66, inset 0 1.5px 4px rgba(255,255,255,0.12)`,
        animation: 'biolum-pulse 3s ease-in-out infinite',
      }}>
        <div style={{
          position: 'absolute', width: '60%', height: 0.5,
          background: `linear-gradient(to right, transparent, ${palette.accent}88, transparent)`,
          left: '20%', top: '40%', borderRadius: 0.5,
        }} />
        <div style={{
          position: 'absolute', width: '40%', height: 0.5,
          background: `linear-gradient(to right, transparent, ${palette.accent}66, transparent)`,
          left: '30%', top: '60%', borderRadius: 0.5,
        }} />
      </div>
      <div style={{
        position: 'absolute', width: 3.5, height: 2, background: palette.leaf,
        left: 1, top: 8, borderRadius: '50% 0 50% 50%', opacity: 0.6,
        transform: 'rotate(-25deg)', boxShadow: `0 0 1.5px ${palette.glow}44`,
      }} />
      <div style={{
        position: 'absolute', width: 3.5, height: 2, background: palette.leaf,
        right: 1, top: 7, borderRadius: '0 50% 50% 50%', opacity: 0.6,
        transform: 'rotate(25deg)', boxShadow: `0 0 1.5px ${palette.glow}44`,
      }} />
    </div>
  );
}

function LanternBloom({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 15, height: 22 }}>
      <div style={{
        position: 'absolute', width: 1, height: 13,
        background: `linear-gradient(to top, ${palette.stem}, ${palette.leaf})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)', borderRadius: 1,
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: 0,
        transform: 'translateX(-50%)',
        animation: 'lantern-swing 4s ease-in-out infinite',
        transformOrigin: 'top center',
      }}>
        <div style={{ width: 0.75, height: 4, background: palette.leaf, margin: '0 auto', borderRadius: 0.5 }} />
        <div className="rounded-full" style={{
          width: 8, height: 7,
          background: `radial-gradient(circle at 45% 40%, ${palette.tip}, ${palette.glow} 50%, ${palette.leaf})`,
          margin: '-0.5px auto 0', transform: 'translateX(0)',
          boxShadow: `0 0 7px ${palette.glow}88, 0 0 14px ${palette.glow}33, inset 0 -1.5px 3px rgba(0,0,0,0.15)`,
          animation: 'biolum-pulse 2s ease-in-out infinite',
          position: 'relative',
        }}>
          <div className="rounded-full" style={{
            position: 'absolute', width: '50%', height: '50%', left: '25%', top: '20%',
            background: `radial-gradient(circle, ${palette.accent}66, transparent)`,
          }} />
        </div>
      </div>
      <div style={{
        position: 'absolute', width: 5, height: 2,
        background: `linear-gradient(to right, ${palette.leaf}, transparent)`,
        right: '55%', top: 11, borderRadius: '50% 0 0 50%', opacity: 0.5, transform: 'rotate(-10deg)',
      }} />
      <div style={{
        position: 'absolute', width: 5, height: 2,
        background: `linear-gradient(to left, ${palette.leaf}, transparent)`,
        left: '55%', top: 13, borderRadius: '0 50% 50% 0', opacity: 0.5, transform: 'rotate(10deg)',
      }} />
      <div style={{
        position: 'absolute', width: 9, height: 2, left: '50%', bottom: -1,
        transform: 'translateX(-50%)',
        background: `radial-gradient(ellipse, ${palette.glow}33 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />
    </div>
  );
}

function CrystalSpire({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 14, height: 24 }}>
      {/* Main crystal */}
      <div style={{
        position: 'absolute', width: 4, height: 16,
        background: `linear-gradient(135deg, ${palette.tip}cc, ${palette.glow} 40%, ${palette.leaf} 80%, ${palette.stem})`,
        left: '50%', bottom: 2, transform: 'translateX(-50%) rotate(2deg)',
        clipPath: 'polygon(50% 0%, 100% 85%, 80% 100%, 20% 100%, 0% 85%)',
        boxShadow: `0 0 6px ${palette.glow}88`,
        animation: 'biolum-pulse 3s ease-in-out infinite',
      }} />
      {/* Side crystal left */}
      <div style={{
        position: 'absolute', width: 2.5, height: 10,
        background: `linear-gradient(135deg, ${palette.accent}cc, ${palette.leaf})`,
        left: 2, bottom: 2, transform: 'rotate(-15deg)',
        clipPath: 'polygon(50% 0%, 100% 85%, 80% 100%, 20% 100%, 0% 85%)',
        boxShadow: `0 0 3px ${palette.glow}66`,
        transformOrigin: 'bottom center',
        animation: 'biolum-pulse 2.5s ease-in-out 0.4s infinite',
      }} />
      {/* Side crystal right */}
      <div style={{
        position: 'absolute', width: 2.5, height: 8,
        background: `linear-gradient(135deg, ${palette.accent}cc, ${palette.leaf})`,
        right: 2, bottom: 2, transform: 'rotate(12deg)',
        clipPath: 'polygon(50% 0%, 100% 85%, 80% 100%, 20% 100%, 0% 85%)',
        boxShadow: `0 0 3px ${palette.glow}66`,
        transformOrigin: 'bottom center',
        animation: 'biolum-pulse 2s ease-in-out 0.8s infinite',
      }} />
      {/* Base rock */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 8, height: 4,
        background: `radial-gradient(ellipse at 50% 40%, ${palette.stem}, #1a1a2e)`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)',
      }} />
      {/* Glow underneath */}
      <div style={{
        position: 'absolute', width: 10, height: 3, left: '50%', bottom: -1,
        transform: 'translateX(-50%)',
        background: `radial-gradient(ellipse, ${palette.glow}44 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />
    </div>
  );
}

function BubbleMoss({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 16, height: 18 }}>
      {/* Moss base */}
      <div style={{
        position: 'absolute', width: 12, height: 6,
        background: `radial-gradient(ellipse at 50% 60%, ${palette.leaf}, ${palette.stem})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)',
        borderRadius: '50% 50% 40% 40%',
        boxShadow: `0 0 4px ${palette.glow}44`,
      }} />
      {/* Bumpy texture */}
      {[0, 1, 2].map((i) => (
        <div key={`bump-${i}`} className="rounded-full" style={{
          position: 'absolute', width: 4.5 - i * 0.5, height: 3.5 - i * 0.3,
          background: `radial-gradient(circle at 40% 35%, ${palette.glow}88, ${palette.leaf})`,
          left: `${20 + i * 25}%`, bottom: 3 + (i % 2) * 1.5,
          boxShadow: `0 0 2px ${palette.glow}44`,
        }} />
      ))}
      {/* Bubbles */}
      {[0, 1, 2, 3].map((i) => {
        const positions = [
          { x: 3, y: 4 }, { x: 9, y: 2 }, { x: 6, y: 6 }, { x: 11, y: 5 },
        ];
        const sizes = [3, 3.5, 2.5, 2.8];
        return (
          <div key={`bubble-${i}`} className="rounded-full" style={{
            position: 'absolute', width: sizes[i], height: sizes[i],
            left: positions[i].x, top: positions[i].y,
            background: `radial-gradient(circle at 35% 30%, ${palette.tip}88, ${palette.glow}44, transparent)`,
            border: `0.3px solid ${palette.accent}44`,
            boxShadow: `0 0 3px ${palette.glow}55, inset 0 0 2px ${palette.tip}33`,
            animation: `spore-float 3.5s ease-in-out ${i * 0.7}s infinite`,
          }} />
        );
      })}
    </div>
  );
}

function VineWhip({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 16, height: 22 }}>
      {/* Root base */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 6, height: 4,
        background: `radial-gradient(circle at 45% 40%, ${palette.leaf}, ${palette.stem})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)',
        boxShadow: `0 0 3px ${palette.glow}44`,
      }} />
      {/* Vine tendrils */}
      {[0, 1, 2, 3].map((i) => {
        const offsets = [-5, -2, 2, 5];
        const heights = [16, 19, 17, 14];
        const rotations = [-18, -6, 8, 20];
        const curveDir = i < 2 ? -1 : 1;
        return (
          <div key={i} style={{
            position: 'absolute', width: 1, height: heights[i],
            background: `linear-gradient(to top, ${palette.stem}, ${palette.leaf}88)`,
            left: `calc(50% + ${offsets[i]}px)`, bottom: 2,
            transform: `translateX(-50%) rotate(${rotations[i]}deg)`,
            transformOrigin: 'bottom center', borderRadius: 1,
            animation: `tendril-sway 2.5s ease-in-out ${i * 0.4}s infinite`,
          }}>
            {/* Leaf at tip */}
            <div style={{
              position: 'absolute', width: 3, height: 2,
              background: palette.leaf,
              top: -1, left: '50%',
              transform: `translateX(-50%) rotate(${curveDir * 30}deg)`,
              borderRadius: curveDir < 0 ? '50% 0 50% 50%' : '0 50% 50% 50%',
              boxShadow: `0 0 2px ${palette.glow}66`,
            }} />
            {/* Small leaf halfway */}
            <div style={{
              position: 'absolute', width: 2, height: 1.5,
              background: palette.leaf,
              top: '50%', left: curveDir < 0 ? -2 : undefined, right: curveDir > 0 ? -2 : undefined,
              borderRadius: '50%', opacity: 0.7,
              boxShadow: `0 0 1.5px ${palette.glow}44`,
            }} />
          </div>
        );
      })}
    </div>
  );
}

function StarBloom({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 16, height: 22 }}>
      {/* Stem */}
      <div style={{
        position: 'absolute', width: 1.2, height: 12,
        background: `linear-gradient(to top, ${palette.stem}, ${palette.leaf})`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)', borderRadius: 1,
      }} />
      {/* Star flower */}
      <div style={{
        position: 'absolute', left: '50%', top: 0,
        transform: 'translateX(-50%)',
        width: 12, height: 12,
      }}>
        {/* Petals */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * 72) - 90;
          const rad = angle * Math.PI / 180;
          const px = 6 + Math.cos(rad) * 4;
          const py = 6 + Math.sin(rad) * 4;
          return (
            <div key={i} className="rounded-full" style={{
              position: 'absolute', width: 4, height: 4,
              left: px - 2, top: py - 2,
              background: `radial-gradient(circle at 40% 35%, ${palette.tip}, ${palette.glow})`,
              boxShadow: `0 0 3px ${palette.glow}88`,
              animation: `biolum-pulse 2.5s ease-in-out ${i * 0.3}s infinite`,
            }} />
          );
        })}
        {/* Center */}
        <div className="rounded-full" style={{
          position: 'absolute', width: 4, height: 4,
          left: 4, top: 4,
          background: `radial-gradient(circle at 45% 40%, ${palette.accent}, ${palette.leaf})`,
          boxShadow: `0 0 4px ${palette.glow}, 0 0 8px ${palette.glow}44`,
          animation: 'biolum-pulse 2s ease-in-out infinite',
        }} />
      </div>
      {/* Leaves on stem */}
      <div style={{
        position: 'absolute', width: 4, height: 2, background: palette.leaf,
        left: 3, top: 13, borderRadius: '50% 0 50% 50%', opacity: 0.6,
        transform: 'rotate(-20deg)', boxShadow: `0 0 1.5px ${palette.glow}44`,
      }} />
      <div style={{
        position: 'absolute', width: 3.5, height: 1.8, background: palette.leaf,
        right: 3, top: 15, borderRadius: '0 50% 50% 50%', opacity: 0.6,
        transform: 'rotate(20deg)', boxShadow: `0 0 1.5px ${palette.glow}44`,
      }} />
    </div>
  );
}

function CoralFan({ palette }: { palette: typeof PLANT_PALETTES[number] }) {
  return (
    <div className="relative" style={{ width: 16, height: 20 }}>
      {/* Base */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 6, height: 3,
        background: `radial-gradient(ellipse at 50% 40%, ${palette.stem}, #1a1a2e)`,
        left: '50%', bottom: 0, transform: 'translateX(-50%)',
      }} />
      {/* Main trunk */}
      <div style={{
        position: 'absolute', width: 1.5, height: 10,
        background: `linear-gradient(to top, ${palette.stem}, ${palette.leaf})`,
        left: '50%', bottom: 2, transform: 'translateX(-50%)', borderRadius: 1,
      }} />
      {/* Fan branches */}
      {[-2, -1, 0, 1, 2].map((i) => {
        const angle = i * 18;
        const h = 10 - Math.abs(i) * 1.5;
        return (
          <div key={i} style={{
            position: 'absolute', width: 1, height: h,
            background: `linear-gradient(to top, ${palette.leaf}88, ${palette.glow}cc)`,
            left: '50%', bottom: 6,
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: 'bottom center', borderRadius: 1,
            boxShadow: `0 0 2px ${palette.glow}44`,
          }}>
            {/* Polyp dots along branch */}
            {[0, 1, 2].map((j) => (
              <div key={j} className="rounded-full" style={{
                position: 'absolute', width: 2, height: 2,
                background: `radial-gradient(circle, ${palette.tip}, ${palette.accent})`,
                left: '50%', top: 1 + j * (h / 4),
                transform: 'translateX(-50%)',
                boxShadow: `0 0 2px ${palette.glow}66`,
                animation: `biolum-pulse 2s ease-in-out ${(i + j) * 0.3}s infinite`,
              }} />
            ))}
          </div>
        );
      })}
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: 14, height: 6, left: '50%', top: 2,
        transform: 'translateX(-50%)',
        background: `radial-gradient(ellipse, ${palette.glow}22 0%, transparent 70%)`,
        borderRadius: '50%',
      }} />
    </div>
  );
}

const VARIANT_COMPONENTS = [
  SpiralFern, MushroomCap, TendrilPlant, PodPlant, LanternBloom,
  CrystalSpire, BubbleMoss, VineWhip, StarBloom, CoralFan,
];

export const PlantEntity = memo(function PlantEntity({ plant }: PlantEntityProps) {
  const palette = PLANT_PALETTES[plant.variant % PLANT_PALETTES.length];
  const VariantComponent = VARIANT_COMPONENTS[plant.variant % VARIANT_COMPONENTS.length];

  return (
    <motion.div
      className="absolute"
      style={{ zIndex: 3, willChange: 'transform' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: plant.x - 7,
        y: plant.y - 11,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        scale: { type: 'spring', stiffness: 300, damping: 20 },
      }}
    >
      <div style={{ animation: 'sway 4s ease-in-out infinite' }}>
        <VariantComponent palette={palette} />
      </div>
    </motion.div>
  );
});
