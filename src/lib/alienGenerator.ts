import type {
  AlienTraits, BodyShape, EyeSize, Pattern,
  ArmStyle, HornType, EyePlacement, MouthStyle, Alien,
} from './types';
import { clamp, hslToString, maybe, randomInt, randomPick, randomRange, shiftHue, uid } from './utils';
import { ALIEN } from './constants';

const BODY_SHAPES: readonly BodyShape[] = ['round', 'blob', 'tall', 'wide', 'pear', 'squat', 'slug', 'triangle'];
const EYE_SIZES: readonly EyeSize[] = ['small', 'medium', 'large'];
const PATTERNS: readonly Pattern[] = ['solid', 'solid', 'spotted', 'striped', 'zigzag', 'belly'];
const ARM_STYLES: readonly ArmStyle[] = ['normal', 'tentacle', 'claw', 'stubby', 'none'];
const HORN_TYPES: readonly HornType[] = ['none', 'none', 'single', 'double', 'antlers', 'spikes'];
const EYE_PLACEMENTS: readonly EyePlacement[] = ['face', 'face', 'face', 'stalks', 'top'];
const MOUTH_STYLES: readonly MouthStyle[] = ['dot', 'smile', 'open', 'teeth', 'fangs'];

export function generateRandomTraits(): AlienTraits {
  const hue = randomRange(0, 360);
  const eyeHue = (hue + randomRange(90, 270)) % 360;
  const secondaryHue = (hue + randomRange(60, 180)) % 360;

  return {
    bodyColor: hslToString(hue, randomRange(70, 100), randomRange(50, 70)),
    secondaryColor: hslToString(secondaryHue, randomRange(60, 100), randomRange(45, 65)),
    eyeColor: hslToString(eyeHue, randomRange(70, 100), randomRange(40, 60)),
    bodyShape: randomPick(BODY_SHAPES),
    eyeCount: randomInt(1, 3),
    eyeSize: randomPick(EYE_SIZES),
    eyePlacement: randomPick(EYE_PLACEMENTS),
    limbCount: randomInt(2, 5),
    antennae: randomInt(0, 2),
    pattern: randomPick(PATTERNS),
    armStyle: randomPick(ARM_STYLES),
    hornType: randomPick(HORN_TYPES),
    mouthStyle: randomPick(MOUTH_STYLES),
    hasTeeth: maybe(0.4),
  };
}

export function mutateTraits(parent: AlienTraits): AlienTraits {
  const newHue = randomRange(0, 360);
  const newSecHue = (newHue + randomRange(60, 180)) % 360;
  const newEyeHue = (newHue + randomRange(90, 270)) % 360;

  return {
    bodyColor: maybe(0.5)
      ? hslToString(newHue, randomRange(70, 100), randomRange(50, 70))
      : shiftHue(parent.bodyColor, randomRange(-80, 80)),
    secondaryColor: maybe(0.5)
      ? hslToString(newSecHue, randomRange(60, 100), randomRange(45, 65))
      : shiftHue(parent.secondaryColor, randomRange(-80, 80)),
    eyeColor: maybe(0.4)
      ? hslToString(newEyeHue, randomRange(70, 100), randomRange(40, 60))
      : shiftHue(parent.eyeColor, randomRange(-90, 90)),
    bodyShape: maybe(0.45) ? randomPick(BODY_SHAPES) : parent.bodyShape,
    eyeCount: maybe(0.35) ? randomInt(1, 3) : clamp(parent.eyeCount + randomPick([-1, 0, 1]), 1, 3),
    eyeSize: maybe(0.35) ? randomPick(EYE_SIZES) : parent.eyeSize,
    eyePlacement: maybe(0.3) ? randomPick(EYE_PLACEMENTS) : parent.eyePlacement,
    limbCount: maybe(0.4) ? randomInt(2, 6) : clamp(parent.limbCount + randomPick([-1, 0, 1]), 2, 6),
    antennae: maybe(0.3) ? randomInt(0, 3) : clamp(parent.antennae + randomPick([-1, 0, 1]), 0, 3),
    pattern: maybe(0.35) ? randomPick(PATTERNS) : parent.pattern,
    armStyle: maybe(0.4) ? randomPick(ARM_STYLES) : parent.armStyle,
    hornType: maybe(0.35) ? randomPick(HORN_TYPES) : parent.hornType,
    mouthStyle: maybe(0.35) ? randomPick(MOUTH_STYLES) : parent.mouthStyle,
    hasTeeth: maybe(0.25) ? !parent.hasTeeth : parent.hasTeeth,
  };
}

export function createAlien(
  worldWidth: number,
  worldHeight: number,
  traits?: AlienTraits,
  parentGeneration = 0,
  baseSpeed: number = ALIEN.BASE_SPEED,
  parentPos?: { x: number; y: number; id: string },
): Alien {
  const margin = ALIEN.SIZE;
  return {
    id: uid(),
    x: parentPos ? parentPos.x : randomRange(margin, worldWidth - margin),
    y: parentPos ? parentPos.y : randomRange(margin, worldHeight - margin),
    vx: 0,
    vy: 0,
    targetId: null,
    traits: traits ?? generateRandomTraits(),
    speed: baseSpeed + randomRange(-5, 5),
    eatingProgress: 0,
    generation: parentGeneration + 1,
    walkPhase: 0,
    facingAngle: randomRange(0, Math.PI * 2),
    wanderTarget: null,
    birthTime: parentPos ? Date.now() : undefined,
    parentId: parentPos?.id,
    bugsEaten: parentPos ? 0 : ALIEN.BUGS_TO_MATURE,
    lastPooBugsEaten: 0,
    isColliding: false,
    angryUntil: 0,
    lastFartTime: 0,
    uncleanedPooCount: 0,
    nearbyPooCount: 0,
    pooExposureTime: 0,
    isDying: false,
    level: 1,
    hp: 100,
    maxHp: 100,
    isAttackingPredator: false,
  };
}
