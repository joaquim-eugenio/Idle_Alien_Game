import { memo, useMemo } from 'react';
import type { PlanetTraits } from '../../lib/types';

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h % 360)},${Math.round(s)}%,${Math.round(l)}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${Math.round(h % 360)},${Math.round(s)}%,${Math.round(l)}%,${a.toFixed(2)})`;
}

interface PlanetEntityProps {
  traits: PlanetTraits;
  className?: string;
}

function renderCraters(traits: PlanetTraits, r: number) {
  if (traits.craters.length === 0) return null;
  const darken = traits.material === 'fire' ? 20 : 15;
  return traits.craters.map((c, i) => {
    const cx = c.cx * r * 2;
    const cy = c.cy * r * 2;
    const cr = c.r * r * 2;
    return (
      <g key={`cr-${i}`}>
        <circle
          cx={cx}
          cy={cy}
          r={cr}
          fill={hsl(traits.baseHue, 25, Math.max(10, 30 - darken))}
          opacity={0.6}
        />
        <circle
          cx={cx - cr * 0.15}
          cy={cy - cr * 0.15}
          r={cr * 0.7}
          fill={hsl(traits.baseHue, 20, Math.max(8, 25 - darken))}
          opacity={0.4}
        />
      </g>
    );
  });
}

function renderTerrainBands(traits: PlanetTraits, r: number) {
  if (traits.terrainType === 'smooth') return null;

  if (traits.terrainType === 'banded') {
    const bands = [];
    const bandCount = 3 + Math.floor((traits.seed % 5));
    for (let i = 0; i < bandCount; i++) {
      const yOff = (i / bandCount) * r * 2 - r * 0.1;
      const h = r * 0.08 + (traits.seed % 3) * 0.02 * r;
      bands.push(
        <ellipse
          key={`band-${i}`}
          cx={r}
          cy={yOff + r * 0.15}
          rx={r * 0.95}
          ry={h}
          fill={hsl(traits.secondaryHue, 40, 45 + (i % 2) * 10)}
          opacity={0.3}
        />
      );
    }
    return <>{bands}</>;
  }

  if (traits.terrainType === 'swirled') {
    const pathSeed = traits.seed % 100;
    return (
      <>
        <path
          d={`M ${r * 0.3} ${r * 0.5} Q ${r} ${r * 0.3 + pathSeed * 0.01} ${r * 1.7} ${r * 0.8}`}
          stroke={hsl(traits.secondaryHue, 50, 55)}
          strokeWidth={r * 0.08}
          fill="none"
          opacity={0.35}
          strokeLinecap="round"
        />
        <path
          d={`M ${r * 0.4} ${r * 1.2} Q ${r * 1.1} ${r * 1.5 + pathSeed * 0.005} ${r * 1.8} ${r * 1.1}`}
          stroke={hsl(traits.secondaryHue, 45, 50)}
          strokeWidth={r * 0.06}
          fill="none"
          opacity={0.3}
          strokeLinecap="round"
        />
      </>
    );
  }

  if (traits.terrainType === 'crystalline') {
    const shards = [];
    const count = 4 + (traits.seed % 4);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (traits.seed % 10) * 0.1;
      const dist = r * 0.3 + (traits.seed % 20) * 0.01 * r;
      const cx = r + Math.cos(angle) * dist;
      const cy = r + Math.sin(angle) * dist;
      const sz = r * 0.08 + (i % 3) * r * 0.03;
      shards.push(
        <polygon
          key={`shard-${i}`}
          points={`${cx},${cy - sz} ${cx + sz * 0.6},${cy + sz * 0.5} ${cx - sz * 0.6},${cy + sz * 0.5}`}
          fill={hsl(traits.secondaryHue, 60, 70)}
          opacity={0.5}
        />
      );
    }
    return <>{shards}</>;
  }

  if (traits.terrainType === 'volcanic') {
    const veins = [];
    const count = 3 + (traits.seed % 3);
    for (let i = 0; i < count; i++) {
      const startAngle = (i / count) * Math.PI * 2;
      const x1 = r + Math.cos(startAngle) * r * 0.2;
      const y1 = r + Math.sin(startAngle) * r * 0.2;
      const x2 = r + Math.cos(startAngle) * r * 0.7;
      const y2 = r + Math.sin(startAngle) * r * 0.7;
      const cpx = r + Math.cos(startAngle + 0.3) * r * 0.5;
      const cpy = r + Math.sin(startAngle + 0.3) * r * 0.5;
      veins.push(
        <path
          key={`vein-${i}`}
          d={`M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`}
          stroke={hsl(15, 100, 55)}
          strokeWidth={r * 0.04}
          fill="none"
          opacity={0.7}
          strokeLinecap="round"
          style={{ animation: `lava-pulse ${2 + i * 0.5}s ease-in-out infinite` }}
        />
      );
    }
    return <>{veins}</>;
  }

  return null;
}

function renderRings(traits: PlanetTraits, r: number) {
  if (!traits.hasRings) return null;

  const tilt = traits.ringTilt;
  return (
    <g transform={`rotate(${tilt}, ${r}, ${r})`}>
      <ellipse
        cx={r}
        cy={r}
        rx={r * 1.6}
        ry={r * 0.25}
        fill="none"
        stroke={hsl(traits.ringHue, 50, 60)}
        strokeWidth={r * 0.1}
        opacity={0.5}
        style={{ animation: 'ring-shimmer 4s ease-in-out infinite' }}
      />
      <ellipse
        cx={r}
        cy={r}
        rx={r * 1.45}
        ry={r * 0.2}
        fill="none"
        stroke={hsl(traits.ringHue, 40, 50)}
        strokeWidth={r * 0.06}
        opacity={0.35}
      />
    </g>
  );
}

function renderMoon(traits: PlanetTraits, r: number, uid: string) {
  if (!traits.hasMoon) return null;

  const orbitR = r + traits.moonOrbitRadius * r;
  const moonR = traits.moonSize / 2;
  const angle = (traits.seed % 628) / 100;
  const mx = r + Math.cos(angle) * orbitR;
  const my = r + Math.sin(angle) * orbitR;

  return (
    <>
      <defs>
        <radialGradient id={`${uid}-moon-grad`}>
          <stop offset="0%" stopColor={hsl(traits.moonHue, 20, 70)} />
          <stop offset="100%" stopColor={hsl(traits.moonHue, 25, 45)} />
        </radialGradient>
      </defs>
      <circle
        cx={mx}
        cy={my}
        r={moonR}
        fill={`url(#${uid}-moon-grad)`}
      />
    </>
  );
}

function renderAtmosphere(traits: PlanetTraits, r: number, uid: string) {
  if (traits.atmosphereIntensity < 0.08) return null;

  return (
    <>
      <defs>
        <radialGradient id={`${uid}-atmo`}>
          <stop offset="70%" stopColor="transparent" />
          <stop
            offset="100%"
            stopColor={hsla(traits.atmosphereHue, 60, 50, traits.atmosphereIntensity)}
          />
        </radialGradient>
      </defs>
      <circle
        cx={r}
        cy={r}
        r={r * 1.08}
        fill={`url(#${uid}-atmo)`}
      />
    </>
  );
}

export const PlanetEntity = memo(function PlanetEntity({ traits, className }: PlanetEntityProps) {
  const uid = `p-${traits.seed}`;
  const r = traits.size / 2;

  const bodyGradient = useMemo(() => {
    const m = traits.material;
    if (m === 'fire') {
      return {
        inner: hsl(traits.baseHue, 80, 50),
        mid: hsl(traits.baseHue, 70, 35),
        outer: hsl(traits.secondaryHue, 60, 20),
      };
    }
    if (m === 'ice') {
      return {
        inner: hsl(traits.baseHue, 40, 80),
        mid: hsl(traits.baseHue, 50, 60),
        outer: hsl(traits.secondaryHue, 45, 35),
      };
    }
    return {
      inner: hsl(traits.baseHue, 45, 55),
      mid: hsl(traits.baseHue, 40, 40),
      outer: hsl(traits.secondaryHue, 35, 25),
    };
  }, [traits.material, traits.baseHue, traits.secondaryHue]);

  const viewSize = traits.hasRings ? r * 3.6 : (traits.hasMoon ? r * 4 : r * 2.4);
  const offset = (viewSize - r * 2) / 2;

  return (
    <svg
      width={viewSize}
      height={viewSize}
      viewBox={`${-offset} ${-offset} ${viewSize} ${viewSize}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={`${uid}-body`} cx="35%" cy="35%">
          <stop offset="0%" stopColor={bodyGradient.inner} />
          <stop offset="50%" stopColor={bodyGradient.mid} />
          <stop offset="100%" stopColor={bodyGradient.outer} />
        </radialGradient>
        <clipPath id={`${uid}-clip`}>
          <circle cx={r} cy={r} r={r} />
        </clipPath>
      </defs>

      {renderAtmosphere(traits, r, uid)}

      <circle
        cx={r}
        cy={r}
        r={r}
        fill={`url(#${uid}-body)`}
      />

      <g clipPath={`url(#${uid}-clip)`}>
        {renderTerrainBands(traits, r)}
        {renderCraters(traits, r)}
      </g>

      {traits.material === 'fire' && (
        <circle
          cx={r}
          cy={r}
          r={r * 1.02}
          fill="none"
          stroke={hsla(20, 100, 50, 0.2)}
          strokeWidth={r * 0.08}
          style={{ animation: 'lava-pulse 3s ease-in-out infinite' }}
        />
      )}

      {renderRings(traits, r)}
      {renderMoon(traits, r, uid)}
    </svg>
  );
});
