import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Bug } from '../../lib/types';

interface BugEntityProps {
  bug: Bug;
}

function shiftColor(hex: string, hueShift: number): string {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  let r = parseInt(m[1], 16) / 255;
  let g = parseInt(m[2], 16) / 255;
  let b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s: number, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  } else { s = 0; }
  h = ((h * 360 + hueShift) % 360 + 360) % 360;
  return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

const RARITY_GLOW = {
  common: '0 0 2px rgba(74, 222, 128, 0.3)',
  rare: '0 0 3px rgba(56, 189, 248, 0.4)',
  golden: '0 0 5px rgba(251, 191, 36, 0.5), 0 0 10px rgba(251, 191, 36, 0.2)',
} as const;

const SPECIES_COLORS = {
  ant: { body: '#4ade80', head: '#22c55e', legs: '#16a34a' },
  beetle: { body: '#8b5cf6', head: '#7c3aed', legs: '#6d28d9' },
  cricket: { body: '#a3e635', head: '#84cc16', legs: '#65a30d' },
  centipede: { body: '#f97316', head: '#ea580c', legs: '#c2410c' },
  ladybug: { body: '#ef4444', head: '#1a1a2e', legs: '#1a1a2e' },
} as const;

function getColors(bug: Bug) {
  const base = SPECIES_COLORS[bug.species];
  return {
    body: shiftColor(base.body, bug.hueShift),
    head: shiftColor(base.head, bug.hueShift),
    legs: shiftColor(base.legs, bug.hueShift),
    glow: RARITY_GLOW[bug.type],
  };
}

function AntBug({ bug }: { bug: Bug }) {
  const s = bug.sizeScale * 0.85;
  const c = getColors(bug);
  const phase = bug.walkPhase;

  const legs = useMemo(() => {
    const result: { y: number; side: number; offset: number }[] = [];
    for (let i = 0; i < 3; i++) {
      result.push({ y: 2 + i * 2, side: -1, offset: i * (Math.PI / 3) });
      result.push({ y: 2 + i * 2, side: 1, offset: i * (Math.PI / 3) + Math.PI });
    }
    return result;
  }, []);

  return (
    <div style={{ width: 8 * s, height: 10 * s, position: 'relative' }}>
      {/* Antennae */}
      <div style={{ position: 'absolute', width: 0.5, height: 2.5 * s, background: c.legs, left: 2.5 * s, top: -1.5 * s, transform: 'rotate(-25deg)', transformOrigin: 'bottom center', borderRadius: 0.5 }} />
      <div style={{ position: 'absolute', width: 0.5, height: 2.5 * s, background: c.legs, right: 2.5 * s, top: -1.5 * s, transform: 'rotate(25deg)', transformOrigin: 'bottom center', borderRadius: 0.5 }} />
      {/* Head */}
      <div className="absolute rounded-full" style={{
        width: 3.5 * s, height: 3 * s,
        background: `radial-gradient(circle at 40% 35%, ${c.head}, ${c.body})`,
        left: '50%', top: 0, transform: 'translateX(-50%)',
        boxShadow: c.glow,
      }}>
        <div className="rounded-full" style={{ position: 'absolute', width: 1.2 * s, height: 1.2 * s, background: '#111', left: '20%', top: '25%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
        <div className="rounded-full" style={{ position: 'absolute', width: 1.2 * s, height: 1.2 * s, background: '#111', right: '20%', top: '25%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
      </div>
      {/* Thorax */}
      <div className="absolute" style={{
        width: 3 * s, height: 2.5 * s,
        background: `radial-gradient(ellipse at 50% 40%, ${c.body}, ${c.head})`,
        left: '50%', top: 2.5 * s, transform: 'translateX(-50%)',
        borderRadius: '40% 40% 35% 35%', boxShadow: `inset 0 -1px 1.5px rgba(0,0,0,0.25)`,
      }} />
      {/* Abdomen */}
      <div className="absolute" style={{
        width: 4 * s, height: 4.5 * s,
        background: `radial-gradient(ellipse at 50% 35%, ${c.body}, ${c.head})`,
        left: '50%', top: 4.5 * s, transform: 'translateX(-50%)',
        borderRadius: '35% 35% 50% 50%', boxShadow: `inset 0 -1.5px 2.5px rgba(0,0,0,0.3)`,
      }}>
        <div style={{ position: 'absolute', width: '70%', height: 0.5, background: 'rgba(0,0,0,0.15)', left: '15%', top: '35%', borderRadius: 0.5 }} />
        <div style={{ position: 'absolute', width: '55%', height: 0.5, background: 'rgba(0,0,0,0.12)', left: '22.5%', top: '55%', borderRadius: 0.5 }} />
      </div>
      {/* Legs */}
      {legs.map((leg, i) => {
        const swing = Math.sin(phase + leg.offset) * 18;
        const stretch = Math.cos(phase + leg.offset) * 0.8;
        return (
          <div key={i} style={{
            position: 'absolute', width: 0.6,
            height: (2.5 + stretch) * s,
            background: c.legs,
            left: leg.side < 0 ? -0.5 * s : undefined,
            right: leg.side > 0 ? -0.5 * s : undefined,
            top: leg.y * s,
            transform: `rotate(${leg.side * (35 + swing)}deg)`,
            transformOrigin: leg.side < 0 ? 'top right' : 'top left',
            borderRadius: 0.5,
          }} />
        );
      })}
    </div>
  );
}

function BeetleBug({ bug }: { bug: Bug }) {
  const s = bug.sizeScale * 0.85;
  const c = getColors(bug);
  const phase = bug.walkPhase;

  return (
    <div style={{ width: 10 * s, height: 9 * s, position: 'relative' }}>
      {/* Head */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 3.5 * s, height: 3 * s,
        background: `radial-gradient(circle at 40% 35%, ${c.head}, ${c.legs})`,
        left: '50%', top: 0, transform: 'translateX(-50%)',
        boxShadow: c.glow, zIndex: 1,
      }}>
        <div className="rounded-full" style={{ position: 'absolute', width: 1.2 * s, height: 1.2 * s, background: '#111', left: '15%', top: '30%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
        <div className="rounded-full" style={{ position: 'absolute', width: 1.2 * s, height: 1.2 * s, background: '#111', right: '15%', top: '30%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
      </div>
      {/* Shell */}
      <div style={{
        position: 'absolute', width: 8 * s, height: 7 * s,
        background: `radial-gradient(ellipse at 45% 35%, ${c.body}, ${c.head})`,
        left: '50%', top: 2 * s, transform: 'translateX(-50%)',
        borderRadius: '45% 45% 50% 50%',
        boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.3), ${c.glow}`,
      }}>
        {/* Shell line */}
        <div style={{ position: 'absolute', width: 0.5, height: '85%', left: '50%', top: '8%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.15)', borderRadius: 1 }} />
        {/* Shine */}
        <div style={{ position: 'absolute', width: '25%', height: '20%', left: '20%', top: '15%', background: 'rgba(255,255,255,0.12)', borderRadius: '50%' }} />
      </div>
      {/* Legs */}
      {[0, 1, 2].map((i) => {
        const swing = Math.sin(phase + i * (Math.PI / 3)) * 15;
        return (
          <div key={i}>
            <div style={{ position: 'absolute', width: 0.6, height: 2.5 * s, background: c.legs, left: 0, top: (3 + i * 2) * s, transform: `rotate(${-40 + swing}deg)`, transformOrigin: 'top right', borderRadius: 0.5 }} />
            <div style={{ position: 'absolute', width: 0.6, height: 2.5 * s, background: c.legs, right: 0, top: (3 + i * 2) * s, transform: `rotate(${40 - swing}deg)`, transformOrigin: 'top left', borderRadius: 0.5 }} />
          </div>
        );
      })}
    </div>
  );
}

function CricketBug({ bug }: { bug: Bug }) {
  const s = bug.sizeScale * 0.85;
  const c = getColors(bug);
  const phase = bug.walkPhase;

  return (
    <div style={{ width: 8 * s, height: 12 * s, position: 'relative' }}>
      {/* Antennae */}
      <div style={{ position: 'absolute', width: 0.5, height: 3 * s, background: c.legs, left: 2 * s, top: -2 * s, transform: 'rotate(-30deg)', transformOrigin: 'bottom center', borderRadius: 0.5 }} />
      <div style={{ position: 'absolute', width: 0.5, height: 3 * s, background: c.legs, right: 2 * s, top: -2 * s, transform: 'rotate(30deg)', transformOrigin: 'bottom center', borderRadius: 0.5 }} />
      {/* Head */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 3 * s, height: 2.5 * s,
        background: `radial-gradient(circle at 40% 35%, ${c.head}, ${c.body})`,
        left: '50%', top: 0, transform: 'translateX(-50%)',
        boxShadow: c.glow, zIndex: 1,
      }}>
        <div className="rounded-full" style={{ position: 'absolute', width: 1.2 * s, height: 1.2 * s, background: '#111', left: '18%', top: '25%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
        <div className="rounded-full" style={{ position: 'absolute', width: 1.2 * s, height: 1.2 * s, background: '#111', right: '18%', top: '25%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
      </div>
      {/* Body */}
      <div style={{
        position: 'absolute', width: 4 * s, height: 8 * s,
        background: `radial-gradient(ellipse at 50% 30%, ${c.body}, ${c.head})`,
        left: '50%', top: 2 * s, transform: 'translateX(-50%)',
        borderRadius: '35% 35% 45% 45%',
        boxShadow: `inset 0 -2px 3px rgba(0,0,0,0.3)`,
      }}>
        <div style={{ position: 'absolute', width: '60%', height: 0.5, background: 'rgba(0,0,0,0.12)', left: '20%', top: '35%', borderRadius: 0.5 }} />
        <div style={{ position: 'absolute', width: '50%', height: 0.5, background: 'rgba(0,0,0,0.1)', left: '25%', top: '55%', borderRadius: 0.5 }} />
      </div>
      {/* Front legs */}
      {[0, 1].map((i) => {
        const swing = Math.sin(phase + i * Math.PI) * 12;
        return (
          <div key={`f${i}`}>
            <div style={{ position: 'absolute', width: 0.5, height: 2 * s, background: c.legs, left: i === 0 ? 0 : undefined, right: i === 1 ? 0 : undefined, top: (3 + i) * s, transform: `rotate(${(i === 0 ? -35 : 35) + (i === 0 ? swing : -swing)}deg)`, transformOrigin: i === 0 ? 'top right' : 'top left', borderRadius: 0.5 }} />
          </div>
        );
      })}
      {/* Large hind legs */}
      {[-1, 1].map((side) => {
        const swing = Math.sin(phase + (side < 0 ? 0 : Math.PI)) * 10;
        return (
          <div key={`h${side}`}>
            <div style={{
              position: 'absolute', width: 0.8, height: 4 * s, background: c.legs,
              left: side < 0 ? -1 * s : undefined, right: side > 0 ? -1 * s : undefined,
              top: 7 * s, transform: `rotate(${side * (50 + swing)}deg)`,
              transformOrigin: side < 0 ? 'top right' : 'top left', borderRadius: 0.5,
            }} />
          </div>
        );
      })}
    </div>
  );
}

function CentipedeBug({ bug }: { bug: Bug }) {
  const s = bug.sizeScale * 0.85;
  const c = getColors(bug);
  const phase = bug.walkPhase;
  const segmentCount = 5;

  return (
    <div style={{ width: 6 * s, height: (3 + segmentCount * 2.2) * s, position: 'relative' }}>
      {/* Head */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 3.5 * s, height: 2.5 * s,
        background: `radial-gradient(circle at 40% 35%, ${c.head}, ${c.body})`,
        left: '50%', top: 0, transform: 'translateX(-50%)',
        boxShadow: c.glow, zIndex: 1,
      }}>
        <div className="rounded-full" style={{ position: 'absolute', width: 1 * s, height: 1 * s, background: '#111', left: '18%', top: '25%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
        <div className="rounded-full" style={{ position: 'absolute', width: 1 * s, height: 1 * s, background: '#111', right: '18%', top: '25%', boxShadow: 'inset 0.5px 0.5px 0 rgba(255,255,255,0.4)' }} />
        {/* Antennae */}
        <div style={{ position: 'absolute', width: 0.5, height: 2 * s, background: c.legs, left: 0, top: -1.5 * s, transform: 'rotate(-35deg)', transformOrigin: 'bottom center', borderRadius: 0.5 }} />
        <div style={{ position: 'absolute', width: 0.5, height: 2 * s, background: c.legs, right: 0, top: -1.5 * s, transform: 'rotate(35deg)', transformOrigin: 'bottom center', borderRadius: 0.5 }} />
      </div>
      {/* Segments with legs */}
      {Array.from({ length: segmentCount }).map((_, i) => {
        const segY = (2.2 + i * 2.2) * s;
        const sway = Math.sin(phase * 0.8 + i * 0.6) * 8;
        const legSwing = Math.sin(phase + i * (Math.PI / segmentCount)) * 20;
        return (
          <div key={i}>
            <div className="rounded-full" style={{
              position: 'absolute',
              width: (3 - i * 0.15) * s, height: 2 * s,
              background: `radial-gradient(ellipse at 50% 40%, ${i % 2 === 0 ? c.body : c.head}, ${c.legs})`,
              left: '50%', top: segY,
              transform: `translateX(calc(-50% + ${sway * 0.3}px))`,
              boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2)',
            }} />
            <div style={{ position: 'absolute', width: 0.5, height: 1.8 * s, background: c.legs, left: 0, top: segY + 0.3 * s, transform: `rotate(${-45 + legSwing}deg)`, transformOrigin: 'top right', borderRadius: 0.5 }} />
            <div style={{ position: 'absolute', width: 0.5, height: 1.8 * s, background: c.legs, right: 0, top: segY + 0.3 * s, transform: `rotate(${45 - legSwing}deg)`, transformOrigin: 'top left', borderRadius: 0.5 }} />
          </div>
        );
      })}
    </div>
  );
}

function LadybugBug({ bug }: { bug: Bug }) {
  const s = bug.sizeScale * 0.85;
  const c = getColors(bug);
  const phase = bug.walkPhase;

  return (
    <div style={{ width: 8 * s, height: 8 * s, position: 'relative' }}>
      {/* Head */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 2.5 * s, height: 2 * s,
        background: c.head, left: '50%', top: 0,
        transform: 'translateX(-50%)', zIndex: 1,
      }}>
        <div className="rounded-full" style={{ position: 'absolute', width: 1 * s, height: 1 * s, background: '#fff', left: '15%', top: '20%' }}>
          <div className="rounded-full" style={{ position: 'absolute', width: 0.5 * s, height: 0.5 * s, background: '#111', left: '30%', top: '30%' }} />
        </div>
        <div className="rounded-full" style={{ position: 'absolute', width: 1 * s, height: 1 * s, background: '#fff', right: '15%', top: '20%' }}>
          <div className="rounded-full" style={{ position: 'absolute', width: 0.5 * s, height: 0.5 * s, background: '#111', left: '30%', top: '30%' }} />
        </div>
      </div>
      {/* Shell */}
      <div className="rounded-full" style={{
        position: 'absolute', width: 7 * s, height: 6.5 * s,
        background: `radial-gradient(ellipse at 45% 35%, ${c.body}, ${shiftColor('#ef4444', bug.hueShift - 15)})`,
        left: '50%', top: 1.5 * s, transform: 'translateX(-50%)',
        boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.3), ${c.glow}`,
      }}>
        {/* Center line */}
        <div style={{ position: 'absolute', width: 0.5, height: '80%', left: '50%', top: '10%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.2)', borderRadius: 1 }} />
        {/* Spots */}
        {[
          { x: 25, y: 30 }, { x: 70, y: 25 },
          { x: 20, y: 60 }, { x: 75, y: 55 },
          { x: 45, y: 70 },
        ].map((spot, i) => (
          <div key={i} className="rounded-full" style={{
            position: 'absolute', width: 1.5 * s, height: 1.5 * s,
            background: 'rgba(0,0,0,0.35)',
            left: `${spot.x}%`, top: `${spot.y}%`,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
        {/* Shine */}
        <div style={{ position: 'absolute', width: '20%', height: '18%', left: '22%', top: '12%', background: 'rgba(255,255,255,0.15)', borderRadius: '50%' }} />
      </div>
      {/* Legs */}
      {[0, 1, 2].map((i) => {
        const swing = Math.sin(phase + i * (Math.PI / 3)) * 15;
        return (
          <div key={i}>
            <div style={{ position: 'absolute', width: 0.5, height: 2 * s, background: c.legs, left: 0, top: (2.5 + i * 1.8) * s, transform: `rotate(${-40 + swing}deg)`, transformOrigin: 'top right', borderRadius: 0.5 }} />
            <div style={{ position: 'absolute', width: 0.5, height: 2 * s, background: c.legs, right: 0, top: (2.5 + i * 1.8) * s, transform: `rotate(${40 - swing}deg)`, transformOrigin: 'top left', borderRadius: 0.5 }} />
          </div>
        );
      })}
    </div>
  );
}

const SPECIES_COMPONENTS = {
  ant: AntBug,
  beetle: BeetleBug,
  cricket: CricketBug,
  centipede: CentipedeBug,
  ladybug: LadybugBug,
} as const;

export const BugEntity = memo(function BugEntity({ bug }: BugEntityProps) {
  const rotation = (bug.angle * 180) / Math.PI + 90;
  const s = bug.sizeScale * 0.85;
  const SpeciesComponent = SPECIES_COMPONENTS[bug.species];

  const baseW = bug.species === 'beetle' ? 10 : bug.species === 'centipede' ? 6 : 8;
  const baseH = bug.species === 'centipede' ? 14 : bug.species === 'cricket' ? 12 : 10;
  const offsetX = (baseW * s) / 2;
  const offsetY = (baseH * s) / 2;

  return (
    <motion.div
      className="absolute"
      style={{ zIndex: 5, willChange: 'transform' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: bug.x - offsetX,
        y: bug.y - offsetY,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        x: { type: 'tween', duration: 0.15, ease: 'linear' },
        y: { type: 'tween', duration: 0.15, ease: 'linear' },
        scale: { type: 'spring', stiffness: 400, damping: 15 },
        opacity: { duration: 0.2 },
      }}
    >
      <div style={{ transform: `rotate(${rotation}deg)` }}>
        <SpeciesComponent bug={bug} />
      </div>
      {bug.type === 'golden' && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)',
            animation: 'pulse-glow 1.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.div>
  );
});
