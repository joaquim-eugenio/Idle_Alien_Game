import { memo, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getGalaxy } from '../../lib/galaxyData';
import { generateGalaxyPlanets } from '../../lib/planetGenerator';
import { PlanetEntity } from './PlanetEntity';
import type { BackgroundPlanet } from '../../lib/types';

function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 0xffffffff);
  };
}

function layoutPlanets(
  planetTraits: ReturnType<typeof generateGalaxyPlanets>,
  seed: number,
): BackgroundPlanet[] {
  const rng = seededRandom(seed + 9999);
  const placed: BackgroundPlanet[] = [];

  for (const traits of planetTraits) {
    let x: number, y: number;
    let attempts = 0;

    do {
      x = 5 + rng() * 90;
      y = 5 + rng() * 90;
      attempts++;
    } while (
      attempts < 30 &&
      placed.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        const minDist = (p.traits.size + traits.size) * 0.08;
        return Math.sqrt(dx * dx + dy * dy) < minDist;
      })
    );

    placed.push({ traits, x, y });
  }

  return placed;
}

const _planetCache = new Map<number, BackgroundPlanet[]>();

function getPlanetsForGalaxy(galaxyId: number): BackgroundPlanet[] {
  if (_planetCache.has(galaxyId)) return _planetCache.get(galaxyId)!;

  const galaxy = getGalaxy(galaxyId);
  if (!galaxy) return [];

  const traits = generateGalaxyPlanets(galaxy.seed, galaxy.planetCount);
  const planets = layoutPlanets(traits, galaxy.seed);
  _planetCache.set(galaxyId, planets);
  return planets;
}

export const BackgroundPlanets = memo(function BackgroundPlanets() {
  const currentGalaxyId = useGameStore((s) => s.currentGalaxyId);

  const planets = useMemo(
    () => getPlanetsForGalaxy(currentGalaxyId),
    [currentGalaxyId],
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        opacity: 0.3,
        filter: 'brightness(0.4)',
        zIndex: 0,
      }}
    >
      {planets.map((planet, i) => (
        <div
          key={`${currentGalaxyId}-${i}`}
          className="absolute"
          style={{
            left: `${planet.x}%`,
            top: `${planet.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: planet.traits.size > 80
              ? `planet-rotate ${40 + (planet.traits.seed % 20)}s linear infinite`
              : undefined,
          }}
        >
          <PlanetEntity traits={planet.traits} />
        </div>
      ))}
    </div>
  );
});
