export type BodyShape = 'round' | 'blob' | 'tall' | 'wide' | 'pear' | 'squat' | 'slug' | 'triangle';
export type EyeSize = 'small' | 'medium' | 'large';
export type Pattern = 'solid' | 'spotted' | 'striped' | 'zigzag' | 'belly';
export type BugType = 'common' | 'rare' | 'golden';
export type ArmStyle = 'normal' | 'tentacle' | 'claw' | 'stubby' | 'none';
export type HornType = 'none' | 'single' | 'double' | 'antlers' | 'spikes';
export type EyePlacement = 'face' | 'stalks' | 'top';
export type MouthStyle = 'dot' | 'smile' | 'open' | 'teeth' | 'fangs';
export type BugSpecies = 'ant' | 'beetle' | 'cricket' | 'centipede' | 'ladybug';
export type SicknessLevel = 'none' | 'light' | 'mid' | 'heavy';

export type PlanetMaterial = 'rock' | 'ice' | 'fire';
export type TerrainType = 'smooth' | 'banded' | 'swirled' | 'crystalline' | 'volcanic';
export type GalaxyType = 'spiral' | 'elliptical' | 'irregular';

export interface CraterDef {
  cx: number;
  cy: number;
  r: number;
}

export interface PlanetTraits {
  material: PlanetMaterial;
  terrainType: TerrainType;
  baseHue: number;
  secondaryHue: number;
  size: number;
  hasRings: boolean;
  ringHue: number;
  ringTilt: number;
  craters: CraterDef[];
  atmosphereHue: number;
  atmosphereIntensity: number;
  hasMoon: boolean;
  moonSize: number;
  moonOrbitRadius: number;
  moonHue: number;
  seed: number;
}

export interface BackgroundPlanet {
  traits: PlanetTraits;
  x: number;
  y: number;
}

export interface GalaxyDef {
  id: number;
  name: string;
  type: GalaxyType;
  planetCount: number;
  seed: number;
  cost: number;
}

export interface AlienTraits {
  bodyColor: string;
  secondaryColor: string;
  eyeColor: string;
  bodyShape: BodyShape;
  eyeCount: number;
  eyeSize: EyeSize;
  eyePlacement: EyePlacement;
  limbCount: number;
  antennae: number;
  pattern: Pattern;
  armStyle: ArmStyle;
  hornType: HornType;
  mouthStyle: MouthStyle;
  hasTeeth: boolean;
}

export interface Alien {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: string | null;
  traits: AlienTraits;
  speed: number;
  eatingProgress: number;
  generation: number;
  walkPhase: number;
  facingAngle: number;
  wanderTarget: { x: number; y: number } | null;
  birthTime?: number;
  parentId?: string;
  bugsEaten: number;
  lastPooBugsEaten: number;
  isColliding: boolean;
  angryUntil: number;
  lastFartTime: number;
  uncleanedPooCount: number;
  sicknessLevel: SicknessLevel;
  isDying: boolean;
  deathTime?: number;
}

export interface Bug {
  id: string;
  x: number;
  y: number;
  energyValue: number;
  type: BugType;
  species: BugSpecies;
  hueShift: number;
  sizeScale: number;
  spawnedAt: number;
  angle: number;
  walkPhase: number;
}

export interface Plant {
  id: string;
  x: number;
  y: number;
  energyValue: number;
  variant: number;
}

export interface Upgrades {
  eatingCapacity: number;
  alienSpeed: number;
  bugSpawnRate: number;
}

export interface WorldSize {
  width: number;
  height: number;
}

export interface Poo {
  id: string;
  x: number;
  y: number;
  spawnedAt: number;
  alienColor: string;
  alienId: string;
}

export interface CollisionEvent {
  id: string;
  x: number;
  y: number;
  color1: string;
  color2: string;
  time: number;
}

export interface GameState {
  energy: number;
  totalEnergyEarned: number;
  aliens: Alien[];
  bugs: Bug[];
  plants: Plant[];
  upgrades: Upgrades;
  reproductionCost: number;
  worldSize: WorldSize;
  bugSpawnTimer: number;
  plantSpawnTimer: number;
  totalBugsEaten: number;
  totalReproductions: number;
  collisionEvents: CollisionEvent[];
  poos: Poo[];
  currentGalaxyId: number;
  isTraveling: boolean;
  defeatedAlien: Alien | null;
}

export interface GameActions {
  tick: (delta: number) => void;
  reproduceAlien: () => boolean;
  upgradeEatingCapacity: () => boolean;
  upgradeSpeed: () => boolean;
  upgradeBugRate: () => boolean;
  removePoo: (id: string) => void;
  clearAllPoos: () => void;
  clearDefeatedAlien: () => void;
  removeAlien: (id: string) => void;
  healAlien: (id: string) => void;
  addEnergy: (amount: number) => void;
  reset: () => void;
  loadState: (saved: Partial<SerializableGameState>) => void;
  getSerializableState: () => SerializableGameState;
  initializeWorldSize: (viewportWidth: number, viewportHeight: number) => void;
  travelToNextGalaxy: () => boolean;
  setTraveling: (v: boolean) => void;
}

export type SerializableGameState = Omit<GameState, 'bugSpawnTimer' | 'plantSpawnTimer' | 'collisionEvents' | 'defeatedAlien'> & { collisionEvents: CollisionEvent[]; poos: Poo[] };

export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  energyAmount: number;
  type: 'energy_pack' | 'remove_ads' | 'starter_pack';
}

export interface ShopState {
  products: ShopProduct[];
  adsRemoved: boolean;
  lastRewardedAdTime: number;
  rewardedAdCooldown: number;
  interstitialCounter: number;
}

export interface ShopActions {
  purchase: (productId: string) => void;
  watchRewardedAd: () => boolean;
  checkInterstitial: () => boolean;
  setAdsRemoved: (removed: boolean) => void;
}

export interface CameraState {
  scale: number;
  offsetX: number;
  offsetY: number;
}
