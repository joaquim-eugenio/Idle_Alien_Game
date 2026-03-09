import { create } from 'zustand';
import type { GameState, GameActions, Bug, Plant, Poo, PredatorBug, SerializableGameState, BugSpecies, CollisionEvent, CombatEvent } from '../lib/types';
import { GAME, SPAWN, ENERGY, ALIEN, COSTS, UPGRADES, HEALTH, GALAXY, PREDATOR } from '../lib/constants';
import { distance, maybe, randomRange, randomInt, uid, normalize, lerp, randomPick } from '../lib/utils';
import { createAlien, generateRandomTraits, mutateTraits } from '../lib/alienGenerator';
import { getNextGalaxy } from '../lib/galaxyData';
import { generatePredatorArchetype, getArchetype } from '../lib/predatorArchetypes';

const BUG_SPECIES: readonly BugSpecies[] = ['ant', 'beetle', 'cricket', 'centipede', 'ladybug'];
const WEIGHTED_BUG_SPECIES: readonly BugSpecies[] = ['ant', 'ant', 'ant', 'beetle', 'beetle', 'cricket', 'cricket', 'centipede', 'ladybug', 'ladybug'];

function createInitialState(): GameState {
  const w = GAME.INITIAL_WORLD_WIDTH;
  const h = GAME.INITIAL_WORLD_HEIGHT;
  const initialBugs: Bug[] = [];
  for (let i = 0; i < 8; i++) {
    initialBugs.push(spawnBug(w, h, 0));
  }
  return {
    energy: 0,
    totalEnergyEarned: 0,
    aliens: [createAlien(w, h, generateRandomTraits(), 0, ALIEN.BASE_SPEED)],
    bugs: initialBugs,
    predatorBugs: [],
    plants: [],
    upgrades: { eatingCapacity: 1, alienSpeed: 0, bugSpawnRate: 0 },
    reproductionCost: COSTS.REPRODUCTION_BASE,
    worldSize: { width: w, height: h },
    bugSpawnTimer: 0,
    plantSpawnTimer: 0,
    predatorSpawnTimer: 0,
    totalBugsEaten: 0,
    totalReproductions: 0,
    collisionEvents: [],
    combatEvents: [],
    poos: [],
    currentGalaxyId: 0,
    isTraveling: false,
    isBlackHoleActive: false,
    blackHoleTargets: [],
    defeatedAlien: null,
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

function spawnBug(worldWidth: number, worldHeight: number, galaxyId: number): Bug {
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
  
  // Scale energy by galaxy
  const galaxyMultiplier = Math.pow(GALAXY.ENERGY_MULTIPLIER_PER_GALAXY, galaxyId);
  energyValue = Math.floor(energyValue * galaxyMultiplier);

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

function spawnPlant(worldWidth: number, worldHeight: number, galaxyId: number): Plant {
  const margin = 20;
  const galaxyMultiplier = Math.pow(GALAXY.ENERGY_MULTIPLIER_PER_GALAXY, galaxyId);
  return {
    id: uid(),
    x: randomRange(margin, worldWidth - margin),
    y: randomRange(margin, worldHeight - margin),
    energyValue: Math.floor(ENERGY.PLANT * galaxyMultiplier),
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

function getPredatorSpeedMultiplier(archetypeId: string): number {
  const archetype = getArchetype(archetypeId);
  return archetype ? archetype.baseSpeed : 1.0;
}

function spawnPredatorBug(worldWidth: number, worldHeight: number, galaxyId: number, avgAlienLevel: number): PredatorBug {
  const archetype = generatePredatorArchetype();
  const level = 1 + galaxyId * PREDATOR.LEVEL_PER_GALAXY + Math.floor(avgAlienLevel * PREDATOR.ALIEN_LEVEL_FACTOR) + randomInt(0, PREDATOR.LEVEL_RANDOM_RANGE);
  const hp = archetype.baseHp * level;
  const sizeScale = Math.min(PREDATOR.BASE_SIZE_SCALE + level * PREDATOR.SIZE_SCALE_PER_LEVEL, PREDATOR.MAX_SIZE_SCALE);
  const margin = 30;
  const galaxyMultiplier = Math.pow(GALAXY.ENERGY_MULTIPLIER_PER_GALAXY, galaxyId);
  
  return {
    id: uid(),
    x: randomRange(margin, worldWidth - margin),
    y: randomRange(margin, worldHeight - margin),
    hp,
    maxHp: hp,
    energyValue: Math.floor(archetype.baseEnergy * galaxyMultiplier * level),
    archetypeId: archetype.id,
    hueShift: randomRange(-20, 20),
    sizeScale,
    spawnedAt: Date.now(),
    angle: randomRange(0, Math.PI * 2),
    walkPhase: randomRange(0, Math.PI * 2),
    targetBugId: null,
    eatingProgress: 0,
    lastDamageTime: 0,
    level,
  };
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
        next.bugs.push(spawnBug(ww, wh, next.currentGalaxyId));
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
        next.plants = [...next.plants, spawnPlant(ww, wh, next.currentGalaxyId)];
        next.plantSpawnTimer = 0;
      }

      // --- Spawn predator bugs ---
      next.predatorSpawnTimer += delta;
      const aliveAliens = next.aliens.filter(a => !a.isDying);
      const aliveAlienCount = aliveAliens.length;
      const avgAlienLevel = aliveAlienCount > 0 ? aliveAliens.reduce((sum, a) => sum + a.level, 0) / aliveAlienCount : 1;
      const spawnInterval = Math.max(PREDATOR.MIN_SPAWN_INTERVAL, PREDATOR.SPAWN_INTERVAL - next.currentGalaxyId * PREDATOR.INTERVAL_REDUCTION_PER_GALAXY);
      const maxPredators = Math.min(PREDATOR.MAX_PREDATORS, PREDATOR.BASE_MAX_PREDATORS + Math.floor(next.currentGalaxyId * PREDATOR.MAX_PREDATORS_PER_GALAXY));
      if (aliveAlienCount >= PREDATOR.MIN_SPAWN_ALIENS
        && next.predatorSpawnTimer >= spawnInterval
        && next.predatorBugs.length < maxPredators) {
        next.predatorBugs = [...next.predatorBugs, spawnPredatorBug(ww, wh, next.currentGalaxyId, avgAlienLevel)];
        next.predatorSpawnTimer = 0;
      }

      // --- Move predator bugs & hunt regular bugs ---
      const now = Date.now();
      const newCombatEvents: CombatEvent[] = [];
      const predatorEatenBugIds = new Set<string>();
      const alienDamageMap = new Map<string, number>();
      for (let pi = 0; pi < next.predatorBugs.length; pi++) {
        const p = next.predatorBugs[pi];
        if (p.hp <= 0) continue;
        p.walkPhase += delta * 3;

        if (p.eatingProgress > 0) {
          p.eatingProgress += delta / PREDATOR.EATING_DURATION;
          if (p.eatingProgress >= 1) {
            p.eatingProgress = 0;
            p.targetBugId = null;
          }
          continue;
        }

        let huntTarget: { id: string; x: number; y: number; type: 'bug' | 'alien' } | null = null;
        let huntDist = PREDATOR.HUNT_RANGE;

        if (p.targetBugId) {
          for (let bi = 0; bi < next.bugs.length; bi++) {
            const b = next.bugs[bi];
            if (b.id === p.targetBugId && !predatorEatenBugIds.has(b.id)) {
              huntTarget = { id: b.id, x: b.x, y: b.y, type: 'bug' };
              huntDist = distance(p.x, p.y, b.x, b.y);
              break;
            }
          }
          if (!huntTarget) {
            for (let ai = 0; ai < next.aliens.length; ai++) {
              const a = next.aliens[ai];
              if (a.id === p.targetBugId && !a.isDying) {
                huntTarget = { id: a.id, x: a.x, y: a.y, type: 'alien' };
                huntDist = distance(p.x, p.y, a.x, a.y);
                break;
              }
            }
          }
        }

        if (!huntTarget) {
          for (let ai = 0; ai < next.aliens.length; ai++) {
            const a = next.aliens[ai];
            if (a.isDying) continue;
            const d = distance(p.x, p.y, a.x, a.y);
            if (d < huntDist) {
              huntDist = d;
              huntTarget = { id: a.id, x: a.x, y: a.y, type: 'alien' };
            }
          }
          for (let bi = 0; bi < next.bugs.length; bi++) {
            const b = next.bugs[bi];
            if (predatorEatenBugIds.has(b.id)) continue;
            const d = distance(p.x, p.y, b.x, b.y);
            if (d < huntDist * 0.8) { // Give aliens a slight priority
              huntDist = d;
              huntTarget = { id: b.id, x: b.x, y: b.y, type: 'bug' };
            }
          }
        }

        const levelSpeedScale = Math.min(1 + p.level * PREDATOR.SPEED_SCALE_PER_LEVEL, PREDATOR.MAX_SPEED_SCALE);
        const pSpeed = PREDATOR.SPEED * getPredatorSpeedMultiplier(p.archetypeId) * levelSpeedScale;

        if (huntTarget) {
          p.targetBugId = huntTarget.id;
          if (huntDist <= PREDATOR.EATING_RANGE) {
            if (huntTarget.type === 'bug') {
              p.eatingProgress = 0.01;
              predatorEatenBugIds.add(huntTarget.id);
            } else if (huntTarget.type === 'alien') {
              p.eatingProgress = 0.01;
              alienDamageMap.set(huntTarget.id, (alienDamageMap.get(huntTarget.id) || 0) + p.level * PREDATOR.DAMAGE_MULTIPLIER);
              newCombatEvents.push({ id: uid(), x: huntTarget.x, y: huntTarget.y, color: '#ff2222', time: now });
            }
          } else {
            const dir = normalize(huntTarget.x - p.x, huntTarget.y - p.y);
            p.angle = Math.atan2(dir.y, dir.x);
            p.x += dir.x * pSpeed * delta;
            p.y += dir.y * pSpeed * delta;
          }
        } else {
          p.targetBugId = null;
          if (maybe(0.008)) p.angle += randomRange(-0.5, 0.5);
          p.x += Math.cos(p.angle) * pSpeed * 0.4 * delta;
          p.y += Math.sin(p.angle) * pSpeed * 0.4 * delta;
        }

        const pMargin = PREDATOR.SIZE;
        if (p.x < pMargin || p.x > ww - pMargin) {
          p.angle = Math.PI - p.angle;
          p.x = Math.max(pMargin, Math.min(ww - pMargin, p.x));
        }
        if (p.y < pMargin || p.y > wh - pMargin) {
          p.angle = -p.angle;
          p.y = Math.max(pMargin, Math.min(wh - pMargin, p.y));
        }
      }

      // Remove bugs eaten by predators
      if (predatorEatenBugIds.size > 0) {
        if (!bugsArrayDirty) { next.bugs = next.bugs.slice(); bugsArrayDirty = true; }
        next.bugs = next.bugs.filter((b) => !predatorEatenBugIds.has(b.id));
      }

      const speed = getAlienSpeed(next);
      const eatenBugIds = new Set<string>();
      const eatenPlantIds = new Set<string>();
      const killedPredatorIds = new Set<string>();
      const claimedTargetIds = new Set<string>();
      let energyGained = 0;
      let bugsEatenCount = 0;
      const newPoos: Poo[] = [];

      // --- Update aliens (new objects for React re-renders, but reuse traits ref) ---
      const newAliens: typeof next.aliens = new Array(next.aliens.length);
      for (let ai = 0; ai < next.aliens.length; ai++) {
        const alien = next.aliens[ai];
        const a = { ...alien, speed };

        const damage = alienDamageMap.get(a.id);
        if (damage && !a.isDying) {
          a.hp -= damage;
          a.lastDamageTime = now;
          if (a.hp <= 0) {
            const aliveCount = next.aliens.filter(al => !al.isDying).length;
            if (aliveCount > 1) {
              a.isDying = true;
              a.deathTime = now;
              next.defeatedAlien = { ...a };
            } else {
              a.hp = 1;
            }
          }
        }

        if (a.isDying) {
          newAliens[ai] = a;
          continue;
        }

        if (a.eatingProgress > 0) {
          a.eatingProgress += delta / ALIEN.EATING_DURATION;
          a.vx = lerp(a.vx, 0, 8 * delta);
          a.vy = lerp(a.vy, 0, 8 * delta);

          if (a.isAttackingPredator && a.targetId) {
            for (let ri = 0; ri < next.predatorBugs.length; ri++) {
              const r = next.predatorBugs[ri];
              if (r.id === a.targetId && r.hp > 0) {
                const combatDps = a.level * ALIEN.ATTACK_MULTIPLIER / ALIEN.EATING_DURATION;
                r.hp -= combatDps * delta;
                r.lastDamageTime = now;
                if (r.hp <= 0) {
                  killedPredatorIds.add(r.id);
                  energyGained += r.energyValue;
                  bugsEatenCount++;
                }
                break;
              }
            }
          }

          if (a.eatingProgress >= 1) {
            if (a.isAttackingPredator && a.targetId) {
              let predatorAlive = false;
              for (let ri = 0; ri < next.predatorBugs.length; ri++) {
                const r = next.predatorBugs[ri];
                if (r.id === a.targetId && r.hp > 0 && !killedPredatorIds.has(r.id)) {
                  predatorAlive = true;
                  break;
                }
              }
              if (predatorAlive) {
                a.eatingProgress = 0.01;
                newCombatEvents.push({ id: uid(), x: a.x, y: a.y, color: '#ff6633', time: now });
              } else {
                a.eatingProgress = 0;
                a.targetId = null;
                a.isAttackingPredator = false;
              }
            } else {
              a.eatingProgress = 0;
              a.targetId = null;
              a.isAttackingPredator = false;
            }
          }
          newAliens[ai] = a;
          continue;
        }

        type TargetRef = { id: string; x: number; y: number; energyValue: number; kind: 'bug' | 'plant' | 'predator' };
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

        // Predator bugs as targets (only if closer than bestDist * 1.5 to avoid deprioritizing food too much)
        for (let ri = 0; ri < next.predatorBugs.length; ri++) {
          const r = next.predatorBugs[ri];
          if (r.hp <= 0 || killedPredatorIds.has(r.id)) continue;
          if (a.targetId && r.id === a.targetId) {
            currentTarget = { id: r.id, x: r.x, y: r.y, energyValue: r.energyValue, kind: 'predator' };
          }
          if (claimedTargetIds.has(r.id)) continue;
          const d = distance(a.x, a.y, r.x, r.y);
          const effectiveDist = d * 1.5;
          if (effectiveDist < bestDist) { bestDist = effectiveDist; bestTarget = { id: r.id, x: r.x, y: r.y, energyValue: r.energyValue, kind: 'predator' }; }
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
          if (target.kind === 'predator') {
            a.eatingProgress = 0.01;
            a.isAttackingPredator = true;
            for (let ri = 0; ri < next.predatorBugs.length; ri++) {
              const r = next.predatorBugs[ri];
              if (r.id === target.id) {
                const combatDps = a.level * ALIEN.ATTACK_MULTIPLIER / ALIEN.EATING_DURATION;
                r.hp -= combatDps * delta;
                r.lastDamageTime = now;
                newCombatEvents.push({ id: uid(), x: (a.x + r.x) / 2, y: (a.y + r.y) / 2, color: '#ff6633', time: now });
                if (r.hp <= 0) {
                  killedPredatorIds.add(r.id);
                  energyGained += r.energyValue;
                  bugsEatenCount++;
                }
                break;
              }
            }
            a.vx = lerp(a.vx, 0, 6 * delta);
            a.vy = lerp(a.vy, 0, 6 * delta);
          } else {
            a.eatingProgress = 0.01;
            let eaten = 0;
            let personalBugsEaten = 0;

            const eatRange = ALIEN.EATING_RANGE * 1.5;
            const eatCap = next.upgrades.eatingCapacity;

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
          }
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

      if (newCombatEvents.length > 0 || next.combatEvents.some((e) => now - e.time >= 600)) {
        next.combatEvents = [
          ...next.combatEvents.filter((e) => now - e.time < 600),
          ...newCombatEvents,
        ];
      }

      for (const a of next.aliens) {
        if (maybe(0.04) && now - a.lastFartTime > 1500) {
          a.lastFartTime = now;
        }
      }

      // --- Poop proximity damage-over-time ---
      let aliveCount = next.aliens.filter(a => !a.isDying).length;
      for (const a of next.aliens) {
        if (a.isDying) {
          a.nearbyPooCount = 0;
          a.pooExposureTime = 0;
          continue;
        }
        let nearby = 0;
        for (let pi = 0; pi < next.poos.length; pi++) {
          const p = next.poos[pi];
          if (distance(a.x, a.y, p.x, p.y) <= HEALTH.POO_DAMAGE_RADIUS) {
            nearby++;
          }
        }
        a.nearbyPooCount = nearby;
        if (nearby > 0) {
          a.pooExposureTime += delta;
          if (a.pooExposureTime >= HEALTH.POO_DAMAGE_DELAY) {
            const dmg = HEALTH.POO_DAMAGE_PER_SECOND * delta * nearby;
            a.hp -= dmg;
            const prevFlash = a.lastDamageTime ?? 0;
            if (now - prevFlash >= 600) {
              a.lastDamageTime = now;
            }
            if (a.hp <= 0) {
              if (aliveCount > 1) {
                a.isDying = true;
                a.deathTime = now;
                next.defeatedAlien = { ...a };
                aliveCount--;
              } else {
                a.hp = 1;
              }
            }
          }
        } else {
          a.pooExposureTime = 0;
        }
      }

      // Remove dead aliens whose dissolve animation has finished
      if (next.aliens.some((a) => a.isDying && a.deathTime != null && now - a.deathTime >= HEALTH.DISSOLVE_DURATION)) {
        next.aliens = next.aliens.filter(
          (a) => !(a.isDying && a.deathTime != null && now - a.deathTime >= HEALTH.DISSOLVE_DURATION),
        );
      }

      // Remove eaten entities (only allocate new arrays when needed)
      if (eatenBugIds.size > 0) {
        next.bugs = next.bugs.filter((b) => !eatenBugIds.has(b.id));
      }
      if (eatenPlantIds.size > 0) {
        next.plants = next.plants.filter((p) => !eatenPlantIds.has(p.id));
      }

      // Remove killed predator bugs (after death animation)
      if (killedPredatorIds.size > 0 || next.predatorBugs.some(p => p.hp <= 0 && now - p.lastDamageTime >= PREDATOR.DEATH_ANIM_MS)) {
        next.predatorBugs = next.predatorBugs.filter(
          (p) => p.hp > 0 || (now - p.lastDamageTime < PREDATOR.DEATH_ANIM_MS)
        );
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

  clearAllPoos: () => {
    set((state) => ({
      poos: [],
      aliens: state.aliens.map((a) => ({
        ...a,
        uncleanedPooCount: 0,
      })),
    }));
  },

  clearDefeatedAlien: () => {
    set({ defeatedAlien: null });
  },

  removeAlien: (id: string) => {
    set((state) => ({
      aliens: state.aliens.filter((a) => a.id !== id),
    }));
  },

  healAlien: (id: string, source: 'energy' | 'ad') => {
    const state = get();
    const alien = state.aliens.find((a) => a.id === id);
    if (!alien || alien.hp >= alien.maxHp) return;

    if (source === 'energy') {
      const cost = HEALTH.HEAL_ENERGY_COST_BASE * alien.level;
      if (state.energy < cost) return;
      set({
        energy: state.energy - cost,
        aliens: state.aliens.map((a) =>
          a.id === id
            ? { ...a, hp: a.maxHp, isDying: false, deathTime: undefined }
            : a,
        ),
      });
    } else {
      set({
        aliens: state.aliens.map((a) =>
          a.id === id
            ? { ...a, hp: a.maxHp, isDying: false, deathTime: undefined }
            : a,
        ),
      });
    }
  },

  upgradeAlienLevel: (id: string) => {
    const state = get();
    const alien = state.aliens.find((a) => a.id === id);
    if (!alien) return false;

    const cost = Math.floor(100 * Math.pow(1.5, alien.level - 1));
    if (state.energy < cost) return false;

    set({
      energy: state.energy - cost,
      aliens: state.aliens.map((a) =>
        a.id === id ? { ...a, level: a.level + 1, maxHp: (a.level + 1) * ALIEN.HP_PER_LEVEL, hp: (a.level + 1) * ALIEN.HP_PER_LEVEL } : a
      ),
    });
    return true;
  },

  addEnergy: (amount: number) => {
    set((state) => ({
      energy: state.energy + amount,
      totalEnergyEarned: state.totalEnergyEarned + amount,
    }));
  },

  reset: () => set(createInitialState()),

  loadState: (saved: Partial<SerializableGameState>) => {
    set((current) => {
      const now = Date.now();
      const offlineMs = saved.lastSaveTime ? now - saved.lastSaveTime : 0;
      const poosCleanedPerAlien = Math.floor(offlineMs / (5 * 60 * 1000)); // 1 poo per 5 minutes

      let remainingPoos = (saved.poos ?? current.poos ?? []).map((p) => ({
        ...p,
        alienId: p.alienId ?? '',
      }));

      const aliens = (saved.aliens ?? current.aliens).map((a) => {
        let uncleanedPooCount = a.uncleanedPooCount ?? 0;
        
        if (poosCleanedPerAlien > 0) {
          const toClean = Math.min(uncleanedPooCount, poosCleanedPerAlien);
          uncleanedPooCount -= toClean;
          
          let removed = 0;
          remainingPoos = remainingPoos.filter(p => {
            if (p.alienId === a.id && removed < toClean) {
              removed++;
              return false;
            }
            return true;
          });
        }

        // Migrate old saves: if sicknessLevel existed, reset hp to maxHp
        const hasOldSickness = 'sicknessLevel' in a && (a as Record<string, unknown>).sicknessLevel !== 'none';
        const maxHp = a.maxHp ?? (a.level ?? 1) * ALIEN.HP_PER_LEVEL;
        const hp = hasOldSickness ? maxHp : (a.hp ?? maxHp);

        return {
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
          uncleanedPooCount,
          nearbyPooCount: 0,
          pooExposureTime: 0,
          isDying: false,
          level: a.level ?? 1,
          hp,
          maxHp,
          isAttackingPredator: false,
        };
      });

      return {
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
        aliens,
        poos: remainingPoos,
        plants: (saved.plants ?? current.plants).map((p) => ({
          ...p,
          variant: p.variant ?? Math.floor(randomRange(0, 10)),
        })),
        predatorBugs: (saved.predatorBugs ?? current.predatorBugs ?? []).map((p) => ({
          ...p,
          targetBugId: null,
          eatingProgress: 0,
          lastDamageTime: p.lastDamageTime ?? 0,
          walkPhase: p.walkPhase ?? randomRange(0, Math.PI * 2),
          angle: p.angle ?? randomRange(0, Math.PI * 2),
          level: p.level ?? 1,
        })),
        currentGalaxyId: saved.currentGalaxyId ?? current.currentGalaxyId ?? 0,
        combatEvents: [],
        isTraveling: false,
        isBlackHoleActive: false,
        blackHoleTargets: [],
        defeatedAlien: null,
        bugSpawnTimer: 0,
        plantSpawnTimer: 0,
        predatorSpawnTimer: 0,
      };
    });
  },

  getSerializableState: (): SerializableGameState => {
    const state = get();
    return {
      energy: state.energy,
      totalEnergyEarned: state.totalEnergyEarned,
      aliens: state.aliens.filter((a) => !a.isDying).map((a) => ({ ...a, eatingProgress: 0, targetId: null, wanderTarget: null, isColliding: false, angryUntil: 0, lastFartTime: 0, isDying: false, deathTime: undefined, isAttackingPredator: false })),
      bugs: state.bugs,
      predatorBugs: state.predatorBugs.filter(p => p.hp > 0).map(p => ({ ...p, targetBugId: null, eatingProgress: 0 })),
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
      isBlackHoleActive: false,
      blackHoleTargets: [],
      lastSaveTime: Date.now(),
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

  sicAlienOnPredator: (predatorId: string) => {
    set((state) => {
      const pred = state.predatorBugs.find(p => p.id === predatorId && p.hp > 0);
      if (!pred) return {};

      let nearestId: string | null = null;
      let nearestDist = Infinity;
      for (const a of state.aliens) {
        if (a.isDying) continue;
        const d = distance(a.x, a.y, pred.x, pred.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestId = a.id;
        }
      }

      if (!nearestId) return {};

      return {
        aliens: state.aliens.map(a =>
          a.id === nearestId
            ? { ...a, targetId: predatorId, eatingProgress: 0, isAttackingPredator: false, wanderTarget: null }
            : a,
        ),
      };
    });
  },

  activateBlackHole: () => {
    set((state) => {
      const targets: { x: number; y: number; color: string; size: number }[] = [];
      for (const p of state.poos) {
        targets.push({ x: p.x, y: p.y, color: p.alienColor || '#8B6914', size: 5 });
      }
      for (const p of state.predatorBugs) {
        if (p.hp > 0) targets.push({ x: p.x, y: p.y, color: '#cc2222', size: 10 });
      }
      return {
        isBlackHoleActive: true,
        blackHoleTargets: targets,
        poos: [],
        predatorBugs: [],
        aliens: state.aliens.map((a) => ({
          ...a,
          uncleanedPooCount: 0,
          targetId: a.isAttackingPredator ? null : a.targetId,
          isAttackingPredator: false,
          eatingProgress: a.isAttackingPredator ? 0 : a.eatingProgress,
        })),
      };
    });
  },

  completeBlackHole: () => {
    set({ isBlackHoleActive: false, blackHoleTargets: [] });
  },
}));
