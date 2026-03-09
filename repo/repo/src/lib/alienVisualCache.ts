import type { AlienTraits } from './types';
import { ALIEN } from './constants';

const SIZE = ALIEN.SIZE;

function darken(hsl: string, amount: number): string {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return hsl;
  return `hsl(${m[1]}, ${m[2]}%, ${Math.max(0, parseInt(m[3]) - amount)}%)`;
}

function lighten(hsl: string, amount: number): string {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!m) return hsl;
  return `hsl(${m[1]}, ${m[2]}%, ${Math.min(100, parseInt(m[3]) + amount)}%)`;
}

function getBodyDimensions(shape: string) {
  switch (shape) {
    case 'blob':     return { w: SIZE * 1.05, h: SIZE * 0.95, radius: '45% 55% 50% 50% / 50% 45% 55% 50%' };
    case 'tall':     return { w: SIZE * 0.72, h: SIZE * 1.2,  radius: '48% 48% 42% 42%' };
    case 'wide':     return { w: SIZE * 1.15, h: SIZE * 0.78, radius: '42% 42% 48% 48%' };
    case 'pear':     return { w: SIZE * 0.9,  h: SIZE * 1.1,  radius: '44% 44% 52% 52%' };
    case 'squat':    return { w: SIZE * 1.2,  h: SIZE * 0.65, radius: '50% 50% 45% 45%' };
    case 'slug':     return { w: SIZE * 1.0,  h: SIZE * 0.8,  radius: '50% 50% 50% 50% / 60% 60% 40% 40%' };
    case 'triangle': return { w: SIZE * 0.95, h: SIZE * 1.05, radius: '30% 30% 50% 50%' };
    default:         return { w: SIZE * 0.9,  h: SIZE * 0.9,  radius: '50%' };
  }
}

export interface CachedAlienVisuals {
  bodyDark15: string;
  bodyDark12: string;
  bodyDark10: string;
  bodyDark5: string;
  bodyLight12: string;
  bodyLight10: string;
  bodyLight15: string;
  secDark10: string;
  secLight10: string;
  secLight15: string;
  bodyDims: { w: number; h: number; radius: string };
  bodyBackground: string;
  bodyBoxShadow: string;
  bellyGradient: string;
  armGradient: string;
  legGradient: string;
  stalkGradient: string;
  antennaeGradient: string;
  antennaeBallGradient: string;
  slugBaseGradient: string;
  hornColor: string;
  hornTip: string;
  armHandNormal: string;
  armHandStubby: string;
}

const cache = new WeakMap<AlienTraits, CachedAlienVisuals>();

export function getAlienVisuals(traits: AlienTraits): CachedAlienVisuals {
  let v = cache.get(traits);
  if (v) return v;

  const bd15 = darken(traits.bodyColor, 15);
  const bd12 = darken(traits.bodyColor, 12);
  const bd10 = darken(traits.bodyColor, 10);
  const bd5  = darken(traits.bodyColor, 5);
  const bl12 = lighten(traits.bodyColor, 12);
  const bl10 = lighten(traits.bodyColor, 10);
  const bl15 = lighten(traits.bodyColor, 15);
  const sd10 = darken(traits.secondaryColor, 10);
  const sl10 = lighten(traits.secondaryColor, 10);
  const sl15 = lighten(traits.secondaryColor, 15);

  const bodyDims = getBodyDimensions(traits.bodyShape);

  let patternOverlay = '';
  if (traits.pattern === 'spotted') {
    patternOverlay = `radial-gradient(circle at 30% 35%, rgba(255,255,255,0.2) 2px, transparent 2px),radial-gradient(circle at 65% 55%, rgba(255,255,255,0.18) 1.5px, transparent 1.5px),radial-gradient(circle at 45% 75%, rgba(255,255,255,0.15) 1.2px, transparent 1.2px)`;
  } else if (traits.pattern === 'striped') {
    patternOverlay = `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)`;
  } else if (traits.pattern === 'zigzag') {
    patternOverlay = `linear-gradient(to bottom, transparent 55%, ${traits.secondaryColor} 55%)`;
  } else if (traits.pattern === 'belly') {
    patternOverlay = `radial-gradient(ellipse at 50% 65%, ${sl10} 25%, transparent 26%)`;
  }

  const baseGrad = `radial-gradient(ellipse at 40% 30%, ${bl12}, ${traits.bodyColor} 60%, ${bd15})`;

  v = {
    bodyDark15: bd15, bodyDark12: bd12, bodyDark10: bd10, bodyDark5: bd5,
    bodyLight12: bl12, bodyLight10: bl10, bodyLight15: bl15,
    secDark10: sd10, secLight10: sl10, secLight15: sl15,
    bodyDims,
    bodyBackground: patternOverlay ? `${patternOverlay}, ${baseGrad}` : baseGrad,
    bodyBoxShadow: `0 2px 8px ${traits.bodyColor}55, inset 0 -3px 6px rgba(0,0,0,0.25), inset 0 2px 4px rgba(255,255,255,0.08)`,
    bellyGradient: `radial-gradient(ellipse, ${sl15} 0%, ${sd10} 80%, transparent 100%)`,
    armGradient: `linear-gradient(to bottom, ${traits.bodyColor}, ${bd10})`,
    legGradient: `linear-gradient(to bottom, ${traits.bodyColor}, ${bd12})`,
    stalkGradient: `linear-gradient(to top, ${traits.bodyColor}, ${bl10})`,
    antennaeGradient: `linear-gradient(to top, ${traits.bodyColor}, ${bl15})`,
    antennaeBallGradient: `radial-gradient(circle at 35% 35%, ${bl15}, ${traits.bodyColor})`,
    slugBaseGradient: `linear-gradient(to bottom, ${bd15}, ${darken(bd15, 8)})`,
    hornColor: bd5,
    hornTip: sl15,
    armHandNormal: `radial-gradient(circle at 40% 35%, ${bl10}, ${bd10})`,
    armHandStubby: `radial-gradient(circle at 40% 35%, ${sl10}, ${bd10})`,
  };
  cache.set(traits, v);
  return v;
}
