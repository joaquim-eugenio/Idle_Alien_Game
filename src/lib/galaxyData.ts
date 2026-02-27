import type { GalaxyDef, GalaxyType } from './types';
import { GALAXY } from './constants';

const PREFIXES = [
  'Nova', 'Zephyr', 'Crimson', 'Phantom', 'Astral', 'Ether', 'Void',
  'Solar', 'Lunar', 'Neon', 'Iron', 'Crystal', 'Shadow', 'Amber',
  'Cobalt', 'Emerald', 'Obsidian', 'Silver', 'Golden', 'Azure',
  'Violet', 'Scarlet', 'Onyx', 'Sapphire', 'Ivory', 'Inferno',
  'Frost', 'Thunder', 'Silent', 'Burning', 'Frozen', 'Ancient',
  'Primal', 'Omega', 'Alpha', 'Delta', 'Sigma', 'Hyper', 'Ultra',
  'Cosmic', 'Stellar', 'Galactic', 'Nebular', 'Quantum', 'Dark',
  'Bright', 'Deep', 'Outer', 'Inner', 'Lost', 'Hidden',
] as const;

const ROOTS = [
  'Centauri', 'Andromeda', 'Orion', 'Draco', 'Lyra', 'Cygnus',
  'Perseus', 'Hydra', 'Phoenix', 'Serpens', 'Aquila', 'Vela',
  'Corvus', 'Lupus', 'Pyxis', 'Fornax', 'Mensa', 'Norma',
  'Musca', 'Caelum', 'Pictor', 'Columba', 'Carina', 'Pavo',
  'Tucana', 'Volans', 'Ara', 'Scutum', 'Dorado', 'Reticulum',
  'Horologium', 'Antlia', 'Sculptor', 'Grus', 'Eridanus', 'Lepus',
  'Crater', 'Chamaeleon', 'Triangulum', 'Circinus', 'Apus', 'Indus',
  'Octans', 'Sextans', 'Cetus', 'Pisces', 'Aquarius', 'Sagitta',
  'Vulpecula', 'Telescopium',
] as const;

const SUFFIXES = [
  'Nebula', 'Vortex', 'Cluster', 'Rift', 'Expanse', 'Dominion',
  'Reach', 'Abyss', 'Horizon', 'Crown', 'Gate', 'Passage',
  'Core', 'Edge', 'Ring', 'Spiral', 'Stream', 'Wave',
  'Storm', 'Drift',
] as const;

const GALAXY_TYPES: readonly GalaxyType[] = ['spiral', 'elliptical', 'irregular'];

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 0xffffffff);
  };
}

function generateGalaxyName(rng: () => number): string {
  const prefix = PREFIXES[Math.floor(rng() * PREFIXES.length)];
  const root = ROOTS[Math.floor(rng() * ROOTS.length)];

  if (rng() < 0.4) {
    const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)];
    return `${prefix} ${root} ${suffix}`;
  }
  return `${prefix} ${root}`;
}

let _galaxies: GalaxyDef[] | null = null;

function buildGalaxies(): GalaxyDef[] {
  const galaxies: GalaxyDef[] = [];

  galaxies.push({
    id: 0,
    name: 'Via Láctea',
    type: 'spiral',
    planetCount: 5,
    seed: 42,
    cost: 0,
  });

  const masterRng = seededRandom(7777);

  const usedNames = new Set<string>(['Via Láctea']);

  for (let i = 1; i < GALAXY.TOTAL_GALAXIES; i++) {
    let name: string;
    do {
      name = generateGalaxyName(masterRng);
    } while (usedNames.has(name));
    usedNames.add(name);

    const cost = Math.ceil(GALAXY.BASE_TRAVEL_COST * Math.pow(GALAXY.COST_SCALE, i - 1));
    const planetCount = GALAXY.MIN_PLANETS + Math.floor(masterRng() * (GALAXY.MAX_PLANETS - GALAXY.MIN_PLANETS + 1));
    const type = GALAXY_TYPES[Math.floor(masterRng() * GALAXY_TYPES.length)];
    const seed = Math.floor(masterRng() * 0xffffffff);

    galaxies.push({ id: i, name, type, planetCount, seed, cost });
  }

  return galaxies;
}

export function getGalaxy(id: number): GalaxyDef | undefined {
  if (!_galaxies) _galaxies = buildGalaxies();
  return _galaxies[id];
}

export function getNextGalaxy(currentId: number): GalaxyDef | undefined {
  return getGalaxy(currentId + 1);
}

export function getGalaxyCost(galaxyId: number): number {
  const g = getGalaxy(galaxyId);
  return g ? g.cost : Infinity;
}

export interface GalaxyVisuals {
  backgroundColor: string;
  nebulaGradients: string;
}

const _visualsCache = new Map<number, GalaxyVisuals>();

export function getGalaxyVisuals(galaxyId: number): GalaxyVisuals {
  if (_visualsCache.has(galaxyId)) return _visualsCache.get(galaxyId)!;

  const galaxy = getGalaxy(galaxyId);
  if (!galaxy) {
    return { backgroundColor: '#0a0a1a', nebulaGradients: 'none' };
  }

  const rng = seededRandom(galaxy.seed + 54321);

  const bgHue = Math.floor(rng() * 360);
  const bgSat = 20 + Math.floor(rng() * 25);
  const bgLight = 4 + Math.floor(rng() * 4);
  const backgroundColor = `hsl(${bgHue}, ${bgSat}%, ${bgLight}%)`;

  const gradients: string[] = [];
  const nebulaCount = 2 + Math.floor(rng() * 2);
  for (let i = 0; i < nebulaCount; i++) {
    const hue = Math.floor(rng() * 360);
    const sat = 45 + Math.floor(rng() * 25);
    const light = 35 + Math.floor(rng() * 20);
    const x = 15 + Math.floor(rng() * 70);
    const y = 15 + Math.floor(rng() * 70);
    const alpha = 0.08 + rng() * 0.08;
    const size = 40 + Math.floor(rng() * 25);
    gradients.push(
      `radial-gradient(ellipse at ${x}% ${y}%, hsla(${hue}, ${sat}%, ${light}%, ${alpha.toFixed(3)}) 0%, transparent ${size}%)`,
    );
  }

  const result: GalaxyVisuals = {
    backgroundColor,
    nebulaGradients: gradients.join(', '),
  };

  _visualsCache.set(galaxyId, result);
  return result;
}
