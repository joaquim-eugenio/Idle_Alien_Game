import type { PlanetTraits, PlanetMaterial, TerrainType, CraterDef } from './types';

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 0xffffffff);
  };
}

function seededRange(rng: () => number, min: number, max: number): number {
  return rng() * (max - min) + min;
}

function seededInt(rng: () => number, min: number, max: number): number {
  return Math.floor(seededRange(rng, min, max + 1));
}

function seededPick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const MATERIALS: readonly PlanetMaterial[] = ['rock', 'ice', 'fire'];
const TERRAINS: readonly TerrainType[] = ['smooth', 'banded', 'swirled', 'crystalline', 'volcanic'];

export function createPlanetTraits(seed: number): PlanetTraits {
  const rng = seededRandom(seed);

  const material = seededPick(rng, MATERIALS);

  let terrainType: TerrainType;
  if (material === 'fire') {
    terrainType = seededPick(rng, ['volcanic', 'swirled', 'smooth'] as const);
  } else if (material === 'ice') {
    terrainType = seededPick(rng, ['crystalline', 'smooth', 'banded'] as const);
  } else {
    terrainType = seededPick(rng, TERRAINS);
  }

  let baseHue: number;
  let secondaryHue: number;
  if (material === 'fire') {
    baseHue = seededRange(rng, 0, 40);
    secondaryHue = seededRange(rng, 20, 60);
  } else if (material === 'ice') {
    baseHue = seededRange(rng, 180, 220);
    secondaryHue = seededRange(rng, 200, 260);
  } else {
    baseHue = seededRange(rng, 0, 360);
    secondaryHue = (baseHue + seededRange(rng, 30, 120)) % 360;
  }

  const craterCount = seededInt(rng, 0, 8);
  const craters: CraterDef[] = [];
  for (let i = 0; i < craterCount; i++) {
    const angle = seededRange(rng, 0, Math.PI * 2);
    const dist = seededRange(rng, 0.05, 0.35);
    craters.push({
      cx: 0.5 + Math.cos(angle) * dist,
      cy: 0.5 + Math.sin(angle) * dist,
      r: seededRange(rng, 0.03, 0.12),
    });
  }

  const hasRings = rng() < 0.3;
  const hasMoon = rng() < 0.25;

  return {
    material,
    terrainType,
    baseHue,
    secondaryHue,
    size: seededRange(rng, 30, 120),
    hasRings,
    ringHue: hasRings ? seededRange(rng, 0, 360) : 0,
    ringTilt: hasRings ? seededRange(rng, -30, 30) : 0,
    craters,
    atmosphereHue: seededRange(rng, 0, 360),
    atmosphereIntensity: seededRange(rng, 0.05, 0.3),
    hasMoon,
    moonSize: hasMoon ? seededRange(rng, 4, 12) : 0,
    moonOrbitRadius: hasMoon ? seededRange(rng, 0.6, 0.9) : 0,
    moonHue: hasMoon ? seededRange(rng, 0, 360) : 0,
    seed,
  };
}

export function generateGalaxyPlanets(galaxySeed: number, count: number): PlanetTraits[] {
  const rng = seededRandom(galaxySeed);
  const planets: PlanetTraits[] = [];
  for (let i = 0; i < count; i++) {
    const planetSeed = Math.floor(rng() * 0xffffffff);
    planets.push(createPlanetTraits(planetSeed));
  }
  return planets;
}
