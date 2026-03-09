import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useCamera } from '../../hooks/useCamera';
import { AlienEntity } from './AlienEntity';
import { BugCanvas } from './BugCanvas';
import { PlantEntity } from './PlantEntity';
import { EatingEffect } from './EatingEffect';
import { MitosisEffect } from './MitosisEffect';
import { CollisionEffect } from './CollisionEffect';
import { FartEffect } from './FartEffect';
import { PooCanvas } from './PooCanvas';
import { PredatorCanvas } from './PredatorCanvas';
import { CombatEffect } from './CombatEffect';
import { PooCleanEffect } from './PooCleanEffect';
import { BackgroundPlanets } from './BackgroundPlanets';
import { StarTravelEffect } from './StarTravelEffect';
import { BlackHoleEffect } from './BlackHoleEffect';
import { getGalaxyVisuals } from '../../lib/galaxyData';

function StarField({ nebulaGradients }: { nebulaGradients: string }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 0.5 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.7,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
        glowSize: Math.random() > 0.8 ? 3 + Math.random() * 4 : 0,
        glowColor: ['rgba(100,150,255,0.15)', 'rgba(255,200,100,0.12)', 'rgba(150,255,200,0.1)'][Math.floor(Math.random() * 3)],
        key: i,
      })),
    [],
  );

  const satellites = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        startY: 15 + Math.random() * 70,
        duration: 18 + Math.random() * 12,
        delay: i * 8 + Math.random() * 5,
        size: 1 + Math.random() * 0.5,
        key: i,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: nebulaGradients || 'none' }}
      />
      {stars.map((star) => (
        <div
          key={star.key}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: '#fff',
            boxShadow: star.glowSize > 0
              ? `0 0 ${star.glowSize}px ${star.glowColor}`
              : undefined,
            animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite${star.glowSize > 0 ? `, star-pulse ${star.duration}s ease-in-out ${star.delay}s infinite` : ''}`,
            '--star-lo': star.opacity * 0.2,
            '--star-hi': star.opacity,
          } as React.CSSProperties}
        />
      ))}
      {satellites.map((sat) => (
        <div
          key={`sat-${sat.key}`}
          className="absolute"
          style={{
            top: `${sat.startY}%`,
            width: sat.size,
            height: sat.size,
            borderRadius: '50%',
            background: '#fff',
            opacity: 0.5,
            boxShadow: '2px 0 4px rgba(200,220,255,0.3)',
            animation: `satellite-move ${sat.duration}s linear ${sat.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth || 400, height: window.innerHeight || 700 });

  const aliens = useGameStore((s) => s.aliens);
  const plants = useGameStore((s) => s.plants);
  const worldSize = useGameStore((s) => s.worldSize);
  const collisionEvents = useGameStore((s) => s.collisionEvents);
  const combatEvents = useGameStore((s) => s.combatEvents);
  const removePoo = useGameStore((s) => s.removePoo);
  const sicAlienOnPredator = useGameStore((s) => s.sicAlienOnPredator);
  const initializeWorldSize = useGameStore((s) => s.initializeWorldSize);
  const currentGalaxyId = useGameStore((s) => s.currentGalaxyId);
  const isTraveling = useGameStore((s) => s.isTraveling);
  const setTraveling = useGameStore((s) => s.setTraveling);
  const isBlackHoleActive = useGameStore((s) => s.isBlackHoleActive);

  const galaxyVisuals = useMemo(() => getGalaxyVisuals(currentGalaxyId), [currentGalaxyId]);

  const isCombatActive = combatEvents.some(e => Date.now() - e.time < 450);

  const handleTravelComplete = useCallback(() => {
    setTraveling(false);
  }, [setTraveling]);

  const camera = useCamera(viewport.width, viewport.height);
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const visBounds = useMemo(() => {
    const margin = 120;
    return {
      left:   -camera.offsetX / camera.scale - margin,
      top:    -camera.offsetY / camera.scale - margin,
      right:  (viewport.width  - camera.offsetX) / camera.scale + margin,
      bottom: (viewport.height - camera.offsetY) / camera.scale + margin,
    };
  }, [camera.offsetX, camera.offsetY, camera.scale, viewport.width, viewport.height]);

  const visiblePlants = useMemo(() =>
    plants.filter(p => p.x >= visBounds.left && p.x <= visBounds.right && p.y >= visBounds.top && p.y <= visBounds.bottom),
    [plants, visBounds],
  );

  const visibleAliens = useMemo(() =>
    aliens.filter(a => a.x >= visBounds.left && a.x <= visBounds.right && a.y >= visBounds.top && a.y <= visBounds.bottom),
    [aliens, visBounds],
  );

  const birthingParentIds = useMemo(() => {
    const now = Date.now();
    const ids = new Set<string>();
    for (const a of aliens) {
      if (a.parentId && a.birthTime != null && now - a.birthTime! < 1200) {
        ids.add(a.parentId);
      }
    }
    return ids;
  }, [aliens]);

  const [cleanEffects, setCleanEffects] = useState<{ id: string; x: number; y: number; time: number }[]>([]);
  const draggingRef = useRef(false);
  const CLEAN_RADIUS = 30;

  const toWorldCoords = useCallback((screenX: number, screenY: number) => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const cam = cameraRef.current;
    return {
      x: (screenX - rect.left - cam.offsetX) / cam.scale,
      y: (screenY - rect.top - cam.offsetY) / cam.scale,
      scale: cam.scale,
    };
  }, []);

  const tryCleanPoos = useCallback((screenX: number, screenY: number) => {
    const w = toWorldCoords(screenX, screenY);
    if (!w) return;
    const scaledRadius = CLEAN_RADIUS / w.scale;

    const currentPoos = useGameStore.getState().poos;
    for (const p of currentPoos) {
      const dx = p.x - w.x;
      const dy = p.y - w.y;
      if (dx * dx + dy * dy <= scaledRadius * scaledRadius) {
        removePoo(p.id);
        setCleanEffects((prev) => [...prev, { id: p.id, x: p.x, y: p.y, time: Date.now() }]);
      }
    }
  }, [removePoo, toWorldCoords]);

  const TAP_PREDATOR_RADIUS = 25;

  const tryTapPredator = useCallback((screenX: number, screenY: number) => {
    const w = toWorldCoords(screenX, screenY);
    if (!w) return;

    const predators = useGameStore.getState().predatorBugs;
    let closestId: string | null = null;
    let closestDist = TAP_PREDATOR_RADIUS;

    for (const p of predators) {
      if (p.hp <= 0) continue;
      const dx = p.x - w.x;
      const dy = p.y - w.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < closestDist) {
        closestDist = d;
        closestId = p.id;
      }
    }

    if (closestId) {
      sicAlienOnPredator(closestId);
    }
  }, [toWorldCoords, sicAlienOnPredator]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    containerRef.current?.setPointerCapture(e.pointerId);
    tryCleanPoos(e.clientX, e.clientY);
    tryTapPredator(e.clientX, e.clientY);
  }, [tryCleanPoos, tryTapPredator]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    tryCleanPoos(e.clientX, e.clientY);
  }, [tryCleanPoos]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    if (cleanEffects.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setCleanEffects((prev) => prev.filter((e) => now - e.time < 500));
    }, 550);
    return () => clearTimeout(timer);
  }, [cleanEffects]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setViewport({ width, height });
        }
      }
    });
    observer.observe(el);

    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setViewport({ width: rect.width, height: rect.height });
      initializeWorldSize(rect.width, rect.height);
    }

    return () => observer.disconnect();
  }, [initializeWorldSize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: galaxyVisuals.backgroundColor, touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <BackgroundPlanets />
      <StarField nebulaGradients={galaxyVisuals.nebulaGradients} />

      <StarTravelEffect active={isTraveling} onComplete={handleTravelComplete} />

      <BlackHoleEffect cameraTransform={camera} />

      {/* Shake wrapper during travel / combat / black hole */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          animation: isTraveling
            ? 'travel-shake 0.15s linear infinite'
            : isBlackHoleActive
              ? 'blackhole-shake 0.12s linear infinite'
              : isCombatActive
                ? 'combat-shake 0.08s linear infinite'
                : undefined,
        }}
      >
        {/* Camera-transformed game world */}
        <div
          className="absolute"
          style={{
            width: worldSize.width,
            height: worldSize.height,
            transform: `translate3d(${camera.offsetX}px,${camera.offsetY}px,0) scale(${camera.scale})`,
            transformOrigin: '0 0',
            transition: 'transform 0.5s ease-out',
            willChange: 'transform',
          }}
        >
        {/* World border glow */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            border: '1px solid rgba(88, 28, 135, 0.2)',
            boxShadow: 'inset 0 0 60px rgba(88, 28, 135, 0.05)',
          }}
        />

        {/* Plants (viewport-culled) */}
        {visiblePlants.map((plant) => (
          <PlantEntity key={plant.id} plant={plant} />
        ))}

        {/* Bugs - rendered on a single canvas (flyweight pattern, culled internally) */}
        <BugCanvas width={worldSize.width} height={worldSize.height} visBounds={visBounds} />

        {/* Predator bugs - rendered on a single canvas (flyweight pattern, culled internally) */}
        <PredatorCanvas width={worldSize.width} height={worldSize.height} visBounds={visBounds} />

        {/* Poos - rendered on a single canvas (flyweight pattern, culled internally) */}
        <PooCanvas width={worldSize.width} height={worldSize.height} visBounds={visBounds} />

        {/* Mitosis effects for reproducing parents */}
        {visibleAliens
          .filter((a) => a.birthTime != null && Date.now() - a.birthTime! < 1200)
          .map((child) => {
            const parent = aliens.find((a) => a.id === child.parentId);
            if (!parent) return null;
            return (
              <MitosisEffect
                key={`mitosis-${child.id}`}
                x={parent.x}
                y={parent.y}
                color={parent.traits.bodyColor}
                childX={child.x}
                childY={child.y}
              />
            );
          })}

        {/* Aliens (viewport-culled, birthing pre-computed) */}
        {visibleAliens.map((alien) => (
          <AlienEntity key={alien.id} alien={alien} isBirthing={birthingParentIds.has(alien.id)} />
        ))}

        {/* Fart effects (viewport-culled via visibleAliens) */}
        {visibleAliens
          .filter((a) => Date.now() - a.lastFartTime < 1200)
          .map((alien) => (
            <FartEffect
              key={`fart-${alien.id}-${alien.lastFartTime}`}
              x={alien.x}
              y={alien.y}
              facingAngle={alien.facingAngle}
              color={alien.traits.bodyColor}
            />
          ))}

        {/* Eating effects (viewport-culled, exclude predator combat) */}
        {visibleAliens
          .filter((a) => a.eatingProgress > 0 && a.eatingProgress < 0.3 && !a.isAttackingPredator)
          .map((alien) => (
            <EatingEffect
              key={`eat-${alien.id}`}
              x={alien.x}
              y={alien.y}
              active={true}
              color={alien.traits.bodyColor}
            />
          ))}

        {/* Combat effects (viewport-culled) */}
        {combatEvents
          .filter(e => e.x >= visBounds.left && e.x <= visBounds.right && e.y >= visBounds.top && e.y <= visBounds.bottom)
          .map((evt) => (
            <CombatEffect
              key={evt.id}
              x={evt.x}
              y={evt.y}
              color={evt.color}
            />
          ))}

        {/* Collision effects (viewport-culled) */}
        {collisionEvents
          .filter(e => e.x >= visBounds.left && e.x <= visBounds.right && e.y >= visBounds.top && e.y <= visBounds.bottom)
          .map((evt) => (
            <CollisionEffect
              key={evt.id}
              x={evt.x}
              y={evt.y}
              color1={evt.color1}
              color2={evt.color2}
            />
          ))}

        {/* Poo clean effects */}
        {cleanEffects.map((e) => (
          <PooCleanEffect key={e.id} x={e.x} y={e.y} />
        ))}
        </div>
      </div>
    </div>
  );
}
