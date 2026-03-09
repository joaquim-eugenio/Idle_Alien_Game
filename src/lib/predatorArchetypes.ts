import { randomPick } from './utils';

export type PredatorBodyShape = 'segmented' | 'armored' | 'spider' | 'narrow' | 'bulky';
export type PredatorHeadShape = 'round' | 'triangular' | 'wide';
export type PredatorLegStyle = 'mantis' | 'thick' | 'spindly' | 'spider';
export type PredatorArmStyle = 'claws' | 'pincers' | 'blades' | 'tentacles' | 'none';
export type PredatorWingStyle = 'translucent' | 'beetle' | 'none';
export type PredatorEyeStyle = 'compound' | 'spider' | 'cyclops' | 'slit';
export type PredatorPattern = 'solid' | 'striped' | 'spotted';

export interface PredatorColorPalette {
  body: string;
  head: string;
  limbs: string;
  accent: string;
}

export interface PredatorArchetype {
  id: string;
  bodyShape: PredatorBodyShape;
  headShape: PredatorHeadShape;
  legStyle: PredatorLegStyle;
  armStyle: PredatorArmStyle;
  wingStyle: PredatorWingStyle;
  eyeStyle: PredatorEyeStyle;
  pattern: PredatorPattern;
  palette: PredatorColorPalette;
  baseHp: number;
  baseSpeed: number;
  baseEnergy: number;
}

const BODY_SHAPES: PredatorBodyShape[] = ['segmented', 'armored', 'spider', 'narrow', 'bulky'];
const HEAD_SHAPES: PredatorHeadShape[] = ['round', 'triangular', 'wide'];
const LEG_STYLES: PredatorLegStyle[] = ['mantis', 'thick', 'spindly', 'spider'];
const ARM_STYLES: PredatorArmStyle[] = ['claws', 'pincers', 'blades', 'tentacles', 'none'];
const WING_STYLES: PredatorWingStyle[] = ['translucent', 'beetle', 'none'];
const EYE_STYLES: PredatorEyeStyle[] = ['compound', 'spider', 'cyclops', 'slit'];
const PATTERNS: PredatorPattern[] = ['solid', 'striped', 'spotted'];

const PALETTES: PredatorColorPalette[] = [
  { body: '#8B6914', head: '#6B4F10', limbs: '#5A3E0A', accent: '#D4A520' },
  { body: '#4A3E8C', head: '#2D2566', limbs: '#1A1540', accent: '#7B6BC4' },
  { body: '#6B2D73', head: '#4A1E50', limbs: '#2D1230', accent: '#CC3333' },
  { body: '#A0755A', head: '#7A5540', limbs: '#5A3D2B', accent: '#D4A070' },
  { body: '#8C1A5A', head: '#661040', limbs: '#4A0A2D', accent: '#CC44AA' },
  { body: '#4A7A30', head: '#3A6020', limbs: '#2A4A15', accent: '#88CC55' },
  { body: '#2F4F4F', head: '#1A2F2F', limbs: '#0F1A1A', accent: '#48D1CC' },
  { body: '#8B0000', head: '#5C0000', limbs: '#330000', accent: '#FF4500' },
];

const archetypeCache = new Map<string, PredatorArchetype>();

export function generatePredatorArchetype(): PredatorArchetype {
  const bodyShape = randomPick(BODY_SHAPES);
  const headShape = randomPick(HEAD_SHAPES);
  const legStyle = randomPick(LEG_STYLES);
  const armStyle = randomPick(ARM_STYLES);
  const wingStyle = randomPick(WING_STYLES);
  const eyeStyle = randomPick(EYE_STYLES);
  const pattern = randomPick(PATTERNS);
  const palette = randomPick(PALETTES);

  const id = `${bodyShape}-${headShape}-${legStyle}-${armStyle}-${wingStyle}-${eyeStyle}-${pattern}-${PALETTES.indexOf(palette)}`;

  if (archetypeCache.has(id)) {
    return archetypeCache.get(id)!;
  }

  // Calculate base stats based on parts
  let hp = 4;
  let speed = 1.0;
  let energy = 20;

  if (bodyShape === 'armored' || bodyShape === 'bulky') { hp += 2; speed -= 0.15; energy += 10; }
  if (bodyShape === 'narrow' || bodyShape === 'spider') { hp -= 1; speed += 0.15; energy -= 5; }
  
  if (legStyle === 'thick') { hp += 1; speed -= 0.1; energy += 5; }
  if (legStyle === 'spindly') { speed += 0.2; }

  if (armStyle === 'pincers' || armStyle === 'blades') { hp += 1; energy += 10; }
  if (wingStyle !== 'none') { speed += 0.2; energy += 5; }

  const archetype: PredatorArchetype = {
    id,
    bodyShape,
    headShape,
    legStyle,
    armStyle,
    wingStyle,
    eyeStyle,
    pattern,
    palette,
    baseHp: Math.max(2, hp),
    baseSpeed: Math.max(0.5, speed),
    baseEnergy: Math.max(10, energy),
  };

  archetypeCache.set(id, archetype);
  return archetype;
}

export function getArchetype(id: string): PredatorArchetype | undefined {
  return archetypeCache.get(id);
}
