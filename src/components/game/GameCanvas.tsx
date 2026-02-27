import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useCamera } from '../../hooks/useCamera';
import { AlienEntity } from './AlienEntity';
import { BugEntity } from './BugEntity';
import { PlantEntity } from './PlantEntity';
import { EatingEffect } from './EatingEffect';
import { MitosisEffect } from './MitosisEffect';
import { CollisionEffect } from './CollisionEffect';
import { FartEffect } from './FartEffect';

function StarField() {
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
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(88, 28, 135, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(29, 78, 216, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 60%)
          `,
        }}
      />
      {stars.map((star) => (
        <motion.div
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
          }}
          animate={{
            opacity: [star.opacity * 0.2, star.opacity, star.opacity * 0.2],
            scale: star.glowSize > 0 ? [1, 1.3, 1] : [1, 1, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
      {/* Satellites */}
      {satellites.map((sat) => (
        <motion.div
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
          }}
          animate={{ left: ['-2%', '102%'] }}
          transition={{
            duration: sat.duration,
            repeat: Infinity,
            delay: sat.delay,
            ease: 'linear',
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
  const bugs = useGameStore((s) => s.bugs);
  const plants = useGameStore((s) => s.plants);
  const worldSize = useGameStore((s) => s.worldSize);
  const collisionEvents = useGameStore((s) => s.collisionEvents);
  const initializeWorldSize = useGameStore((s) => s.initializeWorldSize);

  const camera = useCamera(viewport.width, viewport.height);

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
      style={{ background: 'var(--color-space-dark)' }}
    >
      <StarField />

      {/* Camera-transformed game world */}
      <motion.div
        className="absolute origin-top-left"
        animate={{
          scale: camera.scale,
          x: camera.offsetX,
          y: camera.offsetY,
        }}
        transition={{ type: 'tween', duration: 0.5, ease: 'easeOut' }}
        style={{
          width: worldSize.width,
          height: worldSize.height,
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

        {/* Plants */}
        <AnimatePresence>
          {plants.map((plant) => (
            <PlantEntity key={plant.id} plant={plant} />
          ))}
        </AnimatePresence>

        {/* Bugs */}
        <AnimatePresence>
          {bugs.map((bug) => (
            <BugEntity key={bug.id} bug={bug} />
          ))}
        </AnimatePresence>

        {/* Mitosis effects for reproducing parents */}
        {aliens
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

        {/* Aliens */}
        {aliens.map((alien) => {
          const isBirthing = aliens.some(
            (a) => a.parentId === alien.id && a.birthTime != null && Date.now() - a.birthTime! < 1200,
          );
          return (
            <AlienEntity key={alien.id} alien={alien} isBirthing={isBirthing} />
          );
        })}

        {/* Fart effects */}
        {aliens
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

        {/* Eating effects */}
        {aliens
          .filter((a) => a.eatingProgress > 0 && a.eatingProgress < 0.3)
          .map((alien) => (
            <EatingEffect
              key={`eat-${alien.id}`}
              x={alien.x}
              y={alien.y}
              active={true}
              color={alien.traits.bodyColor}
            />
          ))}

        {/* Collision effects */}
        {collisionEvents.map((evt) => (
          <CollisionEffect
            key={evt.id}
            x={evt.x}
            y={evt.y}
            color1={evt.color1}
            color2={evt.color2}
          />
        ))}
      </motion.div>
    </div>
  );
}
