import { create } from 'zustand';
import type { GameState, GameActions, Bug, Plant, Poo, SerializableGameState, BugSpecies, CollisionEvent } from '../lib/types';
import { GAME, SPAWN, ENERGY, ALIEN, COSTS, UPGRADES, SICKNESS, GALAXY } from '../lib/constants';
import { distance, maybe, randomRange, uid, normalize, lerp, randomPick } from '../lib/utils';
import { createAlien, generateRandomTraits, mutateTraits } from '../lib/alienGenerator';
import { getNextGalaxy } from '../lib/galaxyData';

const BUG_SPECIES: readonly BugSpecies[] = ['ant', 'beetle', 'cricket', 'centipede', 'ladybug'];
const WEIGHTED_BUG_SPECIES: readonly BugSpecies[] = ['ant', 'ant', 'ant', 'beetle', 'beetle', 'cricket', 'cricket', 'centipede', 'ladybug', 'ladybug'];

function createInitialState(): GameState {
  const w = GAME.INITIAL_WORLD_WIDTH;
  const h = GAME.INITIAL_WORLD_HEIGHT;
  const initialBugs: Bug[] = [];
  for (let i = 0; i < 8; i++) {
    initialBugs.push(spawnBug(w, h));
  }
  return {
    energy: 0,
    totalEnergyEarned: 0,
    aliens: [createAlien(w, h, generateRandomTraits(), 0, ALIEN.BASE_SPEED)],
    bugs: initialBugs,
    plants: [],
    upgrades: { eatingCapacity: 1, alienSpeed: 0, bugSpawnRate: 0 },
    reproductionCost: COSTS.REPRODUCTION_BASE,
    worldSize: { width: w, height: h },
    bugSpawnTimer: 0,
    plantSpawnTimer: 0,
    totalBugsEaten: 0,
    totalReproductions: 0,
    collisionEvents: [],
    poos: [],
    currentGalaxyId: 0,
    isTraveling: false,
  };
}

const BUG_SPEED = 12;

function getSpeciesSizeRange(species: BugSpecies): [number, number] {
  switch (species) {
    case 'ant': return [0.50, 0.70];
    case 'ladybug': return [0.75, 0.95];
    case 'beetle': return [1.05, 1.30];
    case 'centipede': return [1.35, 1.65];
    case 'cricket': return [1.55, 1.90];
  }
}

function getSpeciesEnergyMultiplier(species: BugSpecies): number {
  switch (species) {
    case 'ant': return 1;
    case 'ladybug': return 1.2;
    case 'beetle': return 1.5;
    case 'centipede': return 2;
    case 'cricket': return 2.5;
  }
}

function spawnBug(worldWidth: number, worldHeight: number): Bug {
  const roll = Math.random();
  let type: Bug['type'] = 'common';
  let energyValue: number = ENERGY.BUG_COMMON;

  if (roll < SPAWN.BUG_GOLDEN_CHANCE) {
    type = 'golden';
    energyValue = ENERGY.BUG_GOLDEN;
  } else if (roll < SPAWN.BUG_GOLDEN_CHANCE + SPAWN.BUG_RARE_CHANCE) {
    type = 'rare';
    energyValue = ENERGY.BUG_RARE;
  }

  const species = randomPick(WEIGHTED_BUG_SPECIES);
  const [minSize, maxSize] = getSpeciesSizeRange(species);
  energyValue *= getSpeciesEnergyMultiplier(species);
  const margin = 20;
  return {
    id: uid(),
    x: randomRange(margin, worldWidth - margin),
    y: randomRange(margin, worldHeight - margin),
    energyValue,
    type,
    species,
    hueShift: randomRange(-30, 30),
    sizeScale: randomRange(minSize, maxSize),
    spawnedAt: Date.now(),
    angle: randomRange(0, Math.PI * 2),
    walkPhase: randomRange(0, Math.PI * 2),
  };
}

function spawnPlant(worldWidth: number, worldHeight: number): Plant {
  const margin = 20;
  return {
    id: uid(),
    x: randomRange(margin, worldWidth - margin),
    y: randomRange(margin, worldHeight - margin),
    energyValue: ENERGY.PLANT,
    variant: Math.floor(randomRange(0, 10)),
  };
}

function getBugSpawnInterval(state: GameState): number {
  const reductions = Math.pow(UPGRADES.BUG_RATE_REDUCTION, state.upgrades.bugSpawnRate);
  return Math.max(SPAWN.BUG_MIN_INTERVAL, SPAWN.BUG_BASE_INTERVAL * reductions);
}

function getAlienSpeed(state: GameState): number {
  return ALIEN.BASE_SPEED + state.upgrades.alienSpeed * UPGRADES.SPEED_BOOST;
}

function getSpeciesSpeedMultiplier(species: BugSpecies): number {
  switch (species) {
    case 'centipede': return 0.6;
    case 'beetle': return 0.75;
    case 'ladybug': return 0.8;
    case 'ant': return 1.0;
    case 'cricket': return 1.1;
  }
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  tick: (delta: number) => {
    set((state) => {
      const next = { ...state };
      const { width: ww, height: wh } = next.worldSize;

      // --- Spawn bugs (push to existing array, avoid spread) ---
      next.bugSpawnTimer += delta;
      const bugInterval = getBugSpawnInterval(next);
      let bugsArrayDirty = false;
      while (next.bugSpawnTimer >= bugInterval && next.bugs.length < SPAWN.MAX_BUGS) {
        if (!bugsArrayDirty) { next.bugs = next.bugs.slice(); bugsArrayDirty = true; }
        next.bugs.push(spawnBug(ww, wh));
        next.bugSpawnTimer -= bugInterval;
      }
      if (next.bugSpawnTimer >= bugInterval) next.bugSpawnTimer = 0;

      // --- Move bugs IN-PLACE (no new objects, no .map()) ---
      for (let i = 0; i < next.bugs.length; i++) {
        const b = next.bugs[i];
        b.walkPhase += delta * 4;

        const speciesMultiplier = getSpeciesSpeedMultiplier(b.species);
        const rarityMultiplier = b.type === 'golden' ? 0.7 : b.type === 'rare' ? 0.85 : 1;
        const spd = BUG_SPEED * speciesMultiplier * rarityMultiplier;

        if (b.species === 'cricket' && maybe(0.005)) {
          const jumpAngle = b.angle + randomRange(-0.3, 0.3);
          b.x += Math.cos(jumpAngle) * spd * 3 * delta;
          b.y += Math.sin(jumpAngle) * spd * 3 * delta;
        } else if (b.species === 'centipede') {
          const sway = Math.sin(b.walkPhase * 0.5) * 0.3;
          if (maybe(0.005)) b.angle += randomRange(-0.4, 0.4);
          b.x += Math.cos(b.angle + sway) * spd * delta;
          b.y += Math.sin(b.angle + sway) * spd * delta;
        } else {
          if (maybe(0.01)) b.angle += randomRange(-0.6, 0.6);
          b.x += Math.cos(b.angle) * spd * delta;
          b.y += Math.sin(b.angle) * spd * delta;
        }

        const margin = 8;
        if (b.x < margin || b.x > ww - margin) {
          b.angle = Math.PI - b.angle;
          b.x = Math.max(margin, Math.min(ww - margin, b.x));
        }
        if (b.y < margin || b.y > wh - margin) {
          b.angle = -b.angle;
          b.y = Math.max(margin, Math.min(wh - margin, b.y));
        }
      }

      // --- Spawn plants ---
      next.plantSpawnTimer += delta;
      const plantInterval = Math.max(SPAWN.PLANT_MIN_INTERVAL, SPAWN.PLANT_BASE_INTERVAL);
      if (next.plantSpawnTimer >= plantInterval && next.plants.length < SPAWN.MAX_PLANTS) {
        next.plants = [...next.plants, spawnPlant(ww, wh)];
        next.plantSpawnTimer = 0;
      }

      const speed = getAlienSpeed(next);
      const eatenBugIds = new Set<string>();
      const eatenPlantIds = new Set<string>();
      const claimedTargetIds = new Set<string>();
      let energyGained = 0;
      let bugsEatenCount = 0;
      const newPoos: Poo[] = [];

      // --- Update aliens (new objects for React re-renders, but reuse traits ref) ---
      const newAliens: typeof next.aliens = new Array(next.aliens.length);
      for (let ai = 0; ai < next.aliens.length; ai++) {
        const alien = next.aliens[ai];
        const a = { ...alien, speed };

        if (a.eatingProgress > 0) {
          a.eatingProgress += delta / ALIEN.EATING_DURATION;
          a.vx = lerp(a.vx, 0, 8 * delta);
          a.vy = lerp(a.vy, 0, 8 * delta);
          if (a.eatingProgress >= 1) {
            a.eatingProgress = 0;
            a.targetId = null;
          }
          newAliens[ai] = a;
          continue;
        }

        // Find nearest target without creating intermediate arrays
        type TargetRef = { id: string; x: number; y: number; energyValue: number; kind: 'bug' | 'plant' };
        let bestTarget: TargetRef | null = null;
        let bestDist = Infinity;
        let currentTarget: TargetRef | null = null;

        for (let bi = 0; bi < next.bugs.length; bi++) {
          const b = next.bugs[bi];
          if (eatenBugIds.has(b.id) || claimedTargetIds.has(b.id)) continue;
          if (a.targetId && b.id === a.targetId) {
            currentTarget = { id: b.id, x: b.x, y: b.y, energyValue: b.energyValue, kind: 'bug' };
          }
          const d = distance(a.x, a.y, b.x, b.y);
          if (d < bestDist) { bestDist = d; bestTarget = { id: b.id, x: b.x, y: b.y, energyValue: b.energyValue, kind: 'bug' }; }
        }
        for (let pi = 0; pi < next.plants.length; pi++) {
          const p = next.plants[pi];
          if (eatenPlantIds.has(p.id) || claimedTargetIds.has(p.id)) continue;
          if (a.targetId && p.id === a.targetId) {
            currentTarget = { id: p.id, x: p.x, y: p.y, energyValue: p.energyValue, kind: 'plant' };
          }
          const d = distance(a.x, a.y, p.x, p.y);
          if (d < bestDist) { bestDist = d; bestTarget = { id: p.id, x: p.x, y: p.y, energyValue: p.energyValue, kind: 'plant' }; }
        }

        const target = currentTarget ?? bestTarget;

        if (!target) {
          if (!a.wanderTarget || distance(a.x, a.y, a.wanderTarget.x, a.wanderTarget.y) < 10) {
            const m = ALIEN.SIZE * 2;
            a.wanderTarget = { x: randomRange(m, ww - m), y: randomRange(m, wh - m) };
          }
          const wanderSpeed = speed * 0.4;
          const dir = normalize(a.wanderTarget.x - a.x, a.wanderTarget.y - a.y);
          a.vx = lerp(a.vx, dir.x * wanderSpeed, ALIEN.TURN_RATE * delta);
          a.vy = lerp(a.vy, dir.y * wanderSpeed, ALIEN.TURN_RATE * delta);
          a.x += a.vx * delta;
          a.y += a.vy * delta;
          a.x = Math.max(ALIEN.SIZE, Math.min(ww - ALIEN.SIZE, a.x));
          a.y = Math.max(ALIEN.SIZE, Math.min(wh - ALIEN.SIZE, a.y));
          const sv = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
          a.walkPhase += sv * delta * 0.3;
          if (sv > 1) a.facingAngle = Math.atan2(a.vy, a.vx);
          a.targetId = null;
          newAliens[ai] = a;
          continue;
        }

        claimedTargetIds.add(target.id);
        a.targetId = target.id;
        a.wanderTarget = null;

        const dist = distance(a.x, a.y, target.x, target.y);

        if (dist <= ALIEN.EATING_RANGE) {
          a.eatingProgress = 0.01;
          let eaten = 0;
          let personalBugsEaten = 0;

          // Find nearby targets for multi-eat without sorting full array
          const eatRange = ALIEN.EATING_RANGE * 1.5;
          const eatCap = next.upgrades.eatingCapacity;

          // Eat the primary target first
          if (target.kind === 'bug') { eatenBugIds.add(target.id); bugsEatenCount++; personalBugsEaten++; }
          else { eatenPlantIds.add(target.id); }
          claimedTargetIds.add(target.id);
          energyGained += target.energyValue;
          eaten++;

          if (eaten < eatCap) {
            for (let bi = 0; bi < next.bugs.length && eaten < eatCap; bi++) {
              const b = next.bugs[bi];
              if (eatenBugIds.has(b.id) || claimedTargetIds.has(b.id)) continue;
              if (distance(a.x, a.y, b.x, b.y) <= eatRange) {
                eatenBugIds.add(b.id); claimedTargetIds.add(b.id);
                energyGained += b.energyValue; bugsEatenCount++; personalBugsEaten++; eaten++;
              }
            }
          }
          if (eaten < eatCap) {
            for (let pi = 0; pi < next.plants.length && eaten < eatCap; pi++) {
              const p = next.plants[pi];
              if (eatenPlantIds.has(p.id) || claimedTargetIds.has(p.id)) continue;
              if (distance(a.x, a.y, p.x, p.y) <= eatRange) {
                eatenPlantIds.add(p.id); claimedTargetIds.add(p.id);
                energyGained += p.energyValue; eaten++;
              }
            }
          }
          const prevPooTier = Math.floor((a.bugsEaten) / 10);
          a.bugsEaten += personalBugsEaten;
          const newPooTier = Math.floor(a.bugsEaten / 10);
          if (newPooTier > prevPooTier) {
            const poosToAdd = newPooTier - prevPooTier;
            for (let pt = 0; pt < poosToAdd; pt++) {
              newPoos.push({
                id: uid(),
                x: a.x + randomRange(-15, 15),
                y: a.y + randomRange(15, 30),
                spawnedAt: Date.now(),
                alienColor: a.traits.bodyColor,
                alienId: a.id,
              });
            }
            a.uncleanedPooCount += poosToAdd;
            a.lastPooBugsEaten = a.bugsEaten;
          }
          a.vx = lerp(a.vx, 0, 10 * delta);
          a.vy = lerp(a.vy, 0, 10 * delta);
        } else {
          const dir = normalize(target.x - a.x, target.y - a.y);
          const approachFactor = dist < ALIEN.EATING_RANGE * 3
            ? Math.max(0.3, dist / (ALIEN.EATING_RANGE * 3))
            : 1;
          a.vx = lerp(a.vx, dir.x * speed * approachFactor, ALIEN.TURN_RATE * delta);
          a.vy = lerp(a.vy, dir.y * speed * approachFactor, ALIEN.TURN_RATE * delta);
          a.x += a.vx * delta;
          a.y += a.vy * delta;
          a.x = Math.max(ALIEN.SIZE, Math.min(ww - ALIEN.SIZE, a.x));
          a.y = Math.max(ALIEN.SIZE, Math.min(wh - ALIEN.SIZE, a.y));
        }

        const sv = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        a.walkPhase += sv * delta * 0.3;
        if (sv > 1) a.facingAngle = Math.atan2(a.vy, a.vx);
        newAliens[ai] = a;
      }
      next.aliens = newAliens;

      // --- Alien-to-alien collision ---
      const collisionThreshold = ALIEN.SIZE * 1.5;
      const newCollisions: CollisionEvent[] = [];
      const now = Date.now();

      for (let i = 0; i < next.aliens.length; i++) {
        for (let j = i + 1; j < next.aliens.length; j++) {
          const a1 = next.aliens[i];
          const a2 = next.aliens[j];
          const dist = distance(a1.x, a1.y, a2.x, a2.y);
          if (dist < collisionThreshold && dist > 0) {
            const nx = (a2.x - a1.x) / dist;
            const ny = (a2.y - a1.y) / dist;
            const overlap = collisionThreshold - dist;

            a1.x -= nx * overlap * 0.6;
            a1.y -= ny * overlap * 0.6;
            a2.x += nx * overlap * 0.6;
            a2.y += ny * overlap * 0.6;

            const dot1 = a1.vx * nx + a1.vy * ny;
            const dot2 = a2.vx * nx + a2.vy * ny;
            const reflectBoost = 1.8;

            a1.vx = (a1.vx - 2 * dot1 * nx) * reflectBoost;
            a1.vy = (a1.vy - 2 * dot1 * ny) * reflectBoost;
            a2.vx = (a2.vx - 2 * dot2 * nx) * reflectBoost;
            a2.vy = (a2.vy - 2 * dot2 * ny) * reflectBoost;

            const minBounce = 120;
            const away1 = -(a1.vx * nx + a1.vy * ny);
            if (away1 < minBounce) {
              a1.vx -= nx * (minBounce - away1);
              a1.vy -= ny * (minBounce - away1);
            }
            const away2 = a2.vx * nx + a2.vy * ny;
            if (away2 < minBounce) {
              a2.vx += nx * (minBounce - away2);
              a2.vy += ny * (minBounce - away2);
            }

            a1.targetId = null;
            a1.wanderTarget = null;
            a2.targetId = null;
            a2.wanderTarget = null;

            if (!a1.isColliding) {
              a1.isColliding = true;
              a1.angryUntil = now + randomRange(600, 1200);
            }
            if (!a2.isColliding) {
              a2.isColliding = true;
              a2.angryUntil = now + randomRange(600, 1200);
            }

            newCollisions.push({
              id: uid(),
              x: (a1.x + a2.x) / 2,
              y: (a1.y + a2.y) / 2,
              color1: a1.traits.bodyColor,
              color2: a2.traits.bodyColor,
              time: now,
            });

            a1.x = Math.max(ALIEN.SIZE, Math.min(ww - ALIEN.SIZE, a1.x));
            a1.y = Math.max(ALIEN.SIZE, Math.min(wh - ALIEN.SIZE, a1.y));
            a2.x = Math.max(ALIEN.SIZE, Math.min(ww - ALIEN.SIZE, a2.x));
            a2.y = Math.max(ALIEN.SIZE, Math.min(wh - ALIEN.SIZE, a2.y));
          }
        }
      }

      for (const a of next.aliens) {
        if (a.isColliding && a.angryUntil <= now) {
          a.isColliding = false;
        }
      }

      // Collision events: only allocate new array when there are changes
      if (newCollisions.length > 0 || next.collisionEvents.some((e) => now - e.time >= 600)) {
        next.collisionEvents = [
          ...next.collisionEvents.filter((e) => now - e.time < 600),
          ...newCollisions,
        ];
      }

      for (const a of next.aliens) {
        if (maybe(0.04) && now - a.lastFartTime > 1500) {
          a.lastFartTime = now;
        }
      }

      // --- Sickness derivation and death ---
      for (const a of next.aliens) {
        if (a.isDying) continue;
        const count = a.uncleanedPooCount;
        if (count >= SICKNESS.DEATH_THRESHOLD) {
          a.isDying = true;
          a.deathTime = now;
          a.sicknessLevel = 'heavy';
        } else if (count >= SICKNESS.HEAVY_THRESHOLD) {
          a.sicknessLevel = 'heavy';
        } else if (count >= SICKNESS.MID_THRESHOLD) {
          a.sicknessLevel = 'mid';
        } else if (count >= SICKNESS.LIGHT_THRESHOLD) {
          a.sicknessLevel = 'light';
        } else {
          a.sicknessLevel = 'none';
        }
      }

      // Remove dead aliens whose dissolve animation has finished
      if (next.aliens.some((a) => a.isDying && a.deathTime != null && now - a.deathTime >= SICKNESS.DISSOLVE_DURATION)) {
        next.aliens = next.aliens.filter(
          (a) => !(a.isDying && a.deathTime != null && now - a.deathTime >= SICKNESS.DISSOLVE_DURATION),
        );
      }

      // Remove eaten entities (only allocate new arrays when needed)
      if (eatenBugIds.size > 0) {
        next.bugs = next.bugs.filter((b) => !eatenBugIds.has(b.id));
      }
      if (eatenPlantIds.size > 0) {
        next.plants = next.plants.filter((p) => !eatenPlantIds.has(p.id));
      }

      if (newPoos.length > 0) {
        next.poos = [...next.poos, ...newPoos];
      }

      next.energy += energyGained;
      next.totalEnergyEarned += energyGained;
      next.totalBugsEaten += bugsEatenCount;

      // --- Auto-expand world ---
      const alienDensity = next.aliens.length / (next.worldSize.width * next.worldSize.height);
      if (alienDensity > GAME.ALIEN_DENSITY_THRESHOLD) {
        next.worldSize = {
          width: Math.min(next.worldSize.width + GAME.WORLD_EXPAND_STEP, GAME.WORLD_MAX_WIDTH),
          height: Math.min(next.worldSize.height + GAME.WORLD_EXPAND_STEP, GAME.WORLD_MAX_HEIGHT),
        };
      }

      return next;
    });
  },

  reproduceAlien: () => {
    const state = get();
    if (state.energy < state.reproductionCost) return false;
    if (state.aliens.length >= ALIEN.MAX_ALIENS) return false;

    const parent = state.aliens[Math.floor(Math.random() * state.aliens.length)];
    const newTraits = mutateTraits(parent.traits);
    const newAlien = createAlien(
      state.worldSize.width,
      state.worldSize.height,
      newTraits,
      parent.generation,
      getAlienSpeed(state),
      { x: parent.x, y: parent.y, id: parent.id },
    );

    set({
      energy: state.energy - state.reproductionCost,
      aliens: [...state.aliens, newAlien],
      reproductionCost: Math.ceil(
        COSTS.REPRODUCTION_BASE * Math.pow(COSTS.REPRODUCTION_SCALE, state.aliens.length),
      ),
      totalReproductions: state.totalReproductions + 1,
    });
    return true;
  },

  upgradeEatingCapacity: () => {
    const state = get();
    const cost = Math.ceil(
      COSTS.EATING_CAPACITY_BASE *
        Math.pow(COSTS.EATING_CAPACITY_SCALE, state.upgrades.eatingCapacity - 1),
    );
    if (state.energy < cost) return false;

    set({
      energy: state.energy - cost,
      upgrades: {
        ...state.upgrades,
        eatingCapacity: state.upgrades.eatingCapacity + UPGRADES.EATING_CAPACITY_BOOST,
      },
    });
    return true;
  },

  upgradeSpeed: () => {
    const state = get();
    const cost = Math.ceil(
      COSTS.SPEED_BASE * Math.pow(COSTS.SPEED_SCALE, state.upgrades.alienSpeed),
    );
    if (state.energy < cost) return false;

    set({
      energy: state.energy - cost,
      upgrades: {
        ...state.upgrades,
        alienSpeed: state.upgrades.alienSpeed + 1,
      },
    });
    return true;
  },

  upgradeBugRate: () => {
    const state = get();
    const cost = Math.ceil(
      COSTS.BUG_RATE_BASE * Math.pow(COSTS.BUG_RATE_SCALE, state.upgrades.bugSpawnRate),
    );
    if (state.energy < cost) return false;

    set({
      energy: state.energy - cost,
      upgrades: {
        ...state.upgrades,
        bugSpawnRate: state.upgrades.bugSpawnRate + 1,
      },
    });
    return true;
  },

  removePoo: (id: string) => {
    set((state) => {
      const poo = state.poos.find((p) => p.id === id);
      const newPoos = state.poos.filter((p) => p.id !== id);
      if (poo) {
        const aliens = state.aliens.map((a) => {
          if (a.id === poo.alienId && a.uncleanedPooCount > 0) {
            return { ...a, uncleanedPooCount: a.uncleanedPooCount - 1 };
          }
          return a;
        });
        return { poos: newPoos, aliens };
      }
      return { poos: newPoos };
    });
  },

  removeAlien: (id: string) => {
    set((state) => ({
      aliens: state.aliens.filter((a) => a.id !== id),
    }));
  },

  healAlien: (id: string) => {
    set((state) => ({
      aliens: state.aliens.map((a) =>
        a.id === id
          ? { ...a, uncleanedPooCount: 0, sicknessLevel: 'none' as const, isDying: false, deathTime: undefined }
          : a,
      ),
      poos: state.poos.filter((p) => p.alienId !== id),
    }));
  },

  addEnergy: (amount: number) => {
    set((state) => ({
      energy: state.energy + amount,
      totalEnergyEarned: state.totalEnergyEarned + amount,
    }));
  },

  reset: () => set(createInitialState()),

  loadState: (saved: Partial<SerializableGameState>) => {
    set((current) => ({
      ...current,
      ...saved,
      bugs: (saved.bugs ?? current.bugs).map((b) => ({
        ...b,
        angle: b.angle ?? randomRange(0, Math.PI * 2),
        walkPhase: b.walkPhase ?? randomRange(0, Math.PI * 2),
        species: b.species ?? randomPick(BUG_SPECIES as unknown as BugSpecies[]),
        hueShift: b.hueShift ?? randomRange(-30, 30),
        sizeScale: b.sizeScale ?? randomRange(0.7, 1.3),
      })),
      aliens: (saved.aliens ?? current.aliens).map((a) => ({
        ...a,
        vx: a.vx ?? 0,
        vy: a.vy ?? 0,
        walkPhase: a.walkPhase ?? 0,
        facingAngle: a.facingAngle ?? 0,
        wanderTarget: a.wanderTarget ?? null,
        bugsEaten: a.bugsEaten ?? ALIEN.BUGS_TO_MATURE,
        lastPooBugsEaten: a.lastPooBugsEaten ?? 0,
        isColliding: a.isColliding ?? false,
        angryUntil: a.angryUntil ?? 0,
        lastFartTime: a.lastFartTime ?? 0,
        uncleanedPooCount: a.uncleanedPooCount ?? 0,
        sicknessLevel: a.sicknessLevel ?? 'none',
        isDying: false,
      })),
      poos: (saved.poos ?? current.poos ?? []).map((p) => ({
        ...p,
        alienId: p.alienId ?? '',
      })),
      plants: (saved.plants ?? current.plants).map((p) => ({
        ...p,
        variant: p.variant ?? Math.floor(randomRange(0, 10)),
      })),
      currentGalaxyId: saved.currentGalaxyId ?? current.currentGalaxyId ?? 0,
      isTraveling: false,
      bugSpawnTimer: 0,
      plantSpawnTimer: 0,
    }));
  },

  getSerializableState: (): SerializableGameState => {
    const state = get();
    return {
      energy: state.energy,
      totalEnergyEarned: state.totalEnergyEarned,
      aliens: state.aliens.filter((a) => !a.isDying).map((a) => ({ ...a, eatingProgress: 0, targetId: null, wanderTarget: null, isColliding: false, angryUntil: 0, lastFartTime: 0, isDying: false, deathTime: undefined })),
      bugs: state.bugs,
      plants: state.plants,
      upgrades: state.upgrades,
      reproductionCost: state.reproductionCost,
      worldSize: state.worldSize,
      totalBugsEaten: state.totalBugsEaten,
      totalReproductions: state.totalReproductions,
      collisionEvents: [],
      poos: state.poos,
      currentGalaxyId: state.currentGalaxyId,
      isTraveling: false,
    };
  },

  initializeWorldSize: (viewportWidth: number, viewportHeight: number) => {
    set((state) => {
      const w = Math.max(GAME.INITIAL_WORLD_WIDTH, Math.min(viewportWidth, GAME.WORLD_MAX_WIDTH));
      const h = Math.max(GAME.INITIAL_WORLD_HEIGHT, Math.min(viewportHeight, GAME.WORLD_MAX_HEIGHT));
      if (state.worldSize.width < w || state.worldSize.height < h) {
        return {
          worldSize: {
            width: Math.max(state.worldSize.width, w),
            height: Math.max(state.worldSize.height, h),
          },
        };
      }
      return {};
    });
  },

  travelToNextGalaxy: () => {
    const state = get();
    const next = getNextGalaxy(state.currentGalaxyId);
    if (!next) return false;
    if (state.energy < next.cost) return false;
    if (state.currentGalaxyId >= GALAXY.TOTAL_GALAXIES - 1) return false;

    set({
      energy: state.energy - next.cost,
      isTraveling: true,
    });
    return true;
  },

  setTraveling: (v: boolean) => {
    set((state) => {
      if (!v && state.isTraveling) {
        return {
          isTraveling: false,
          currentGalaxyId: state.currentGalaxyId + 1,
        };
      }
      return { isTraveling: v };
    });
  },
}));
