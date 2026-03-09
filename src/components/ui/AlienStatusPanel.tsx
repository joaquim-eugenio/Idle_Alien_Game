import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useAdManager } from '../../hooks/useAdManager';
import { AlienMiniature } from './AlienMiniature';
import type { Alien, SicknessLevel } from '../../lib/types';
import { ALIEN, SICKNESS, PREDATOR } from '../../lib/constants';
import { formatEnergy } from '../../lib/utils';

const SICKNESS_LABELS: Record<SicknessLevel, { label: string; color: string }> = {
  none: { label: 'Healthy', color: '#39ff14' },
  light: { label: 'Mild', color: '#c8e636' },
  mid: { label: 'Moderate', color: '#f5a623' },
  heavy: { label: 'Critical', color: '#ef4444' },
};

function getLifeStage(alien: Alien): string {
  if (alien.isDying) return 'Dying';
  const progress = alien.bugsEaten / ALIEN.BUGS_TO_MATURE;
  if (progress < 1) return 'Baby';
  return 'Grown';
}

function AlienStatusRow({ alien, onHeal, onUpgrade, energy }: { alien: Alien; onHeal: (id: string) => void; onUpgrade: (id: string) => void; energy: number }) {
  const sickness = SICKNESS_LABELS[alien.sicknessLevel];
  const stage = getLifeStage(alien);
  const isSick = alien.sicknessLevel !== 'none';
  const upgradeCost = Math.floor(100 * Math.pow(1.5, alien.level - 1));
  const canUpgrade = energy >= upgradeCost && !alien.isDying;
  const combatPower = PREDATOR.DAMAGE_PER_HIT + ((alien.level - 1) * PREDATOR.POWER_PER_LEVEL);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${isSick ? `${sickness.color}33` : 'rgba(58,58,110,0.3)'}`,
      }}
    >
      <div
        className="rounded-lg overflow-hidden flex items-center justify-center relative"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${isSick ? `${sickness.color}44` : 'rgba(58,58,110,0.4)'}`,
          width: 52,
          height: 52,
          flexShrink: 0,
        }}
      >
        <AlienMiniature alien={alien} size={48} />
        <div className="absolute bottom-0 right-0 bg-black/80 px-1 rounded-tl text-[9px] font-bold" style={{ color: 'var(--color-energy-green)' }}>
          Lv.{alien.level}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{
              background: `${sickness.color}22`,
              color: sickness.color,
              border: `1px solid ${sickness.color}33`,
            }}
          >
            {stage}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--color-ui-muted)' }}>
            Gen {alien.generation}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs">🐛</span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: 'var(--color-ui-text)' }}
            >
              {alien.bugsEaten}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs">⚔️</span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: 'var(--color-ui-text)' }}
            >
              {combatPower}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs">🤢</span>
            <span
              className="text-xs font-medium"
              style={{ color: sickness.color }}
            >
              {sickness.label}
            </span>
          </div>
        </div>

        <div className="mt-1.5">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)', width: '100%' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (alien.uncleanedPooCount / SICKNESS.DEATH_THRESHOLD) * 100)}%`,
                background: `linear-gradient(90deg, ${sickness.color}88, ${sickness.color})`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1 items-end">
        {isSick && (
          <motion.button
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              flexShrink: 0,
            }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onHeal(alien.id)}
          >
            <span>🎬</span>
            <span>Heal</span>
          </motion.button>
        )}
        {!isSick && (
          <motion.button
            className="flex flex-col items-center justify-center px-2 py-1 rounded-lg active:scale-95"
            style={{
              background: canUpgrade ? 'var(--color-ui-surface)' : 'rgba(30,30,63,0.5)',
              border: `1px solid ${canUpgrade ? 'var(--color-ui-border)' : 'rgba(58,58,110,0.3)'}`,
              opacity: canUpgrade ? 1 : 0.5,
              flexShrink: 0,
              minWidth: '50px',
            }}
            whileTap={{ scale: 0.92 }}
            onClick={() => onUpgrade(alien.id)}
            disabled={!canUpgrade}
          >
            <span className="text-[10px] font-bold" style={{ color: 'var(--color-ui-text)' }}>UP</span>
            <span className="text-[9px] font-bold" style={{ color: 'var(--color-energy-green)' }}>{formatEnergy(upgradeCost)}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

interface AlienStatusPanelProps {
  onClose: () => void;
}

export function AlienStatusPanel({ onClose }: AlienStatusPanelProps) {
  const energy = useGameStore((s) => s.energy);
  const aliens = useGameStore((s) => s.aliens);
  const healAlien = useGameStore((s) => s.healAlien);
  const upgradeAlienLevel = useGameStore((s) => s.upgradeAlienLevel);
  const { watchRewardedAd } = useAdManager();

  const handleHeal = useCallback((alienId: string) => {
    const adWatched = watchRewardedAd();
    if (adWatched) {
      healAlien(alienId);
    }
  }, [watchRewardedAd, healAlien]);

  const handleUpgrade = useCallback((alienId: string) => {
    upgradeAlienLevel(alienId);
  }, [upgradeAlienLevel]);

  const sickCount = aliens.filter((a) => a.sicknessLevel !== 'none').length;
  const sortedAliens = [...aliens]
    .filter((a) => !a.isDying)
    .sort((a, b) => {
      const sicknessOrder: Record<SicknessLevel, number> = { heavy: 0, mid: 1, light: 2, none: 3 };
      return sicknessOrder[a.sicknessLevel] - sicknessOrder[b.sicknessLevel];
    });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <motion.div
        className="relative w-[92%] max-w-sm rounded-2xl flex flex-col"
        style={{
          background: 'var(--color-ui-surface)',
          border: '1px solid var(--color-ui-border)',
          maxHeight: '75dvh',
        }}
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2" style={{ flexShrink: 0 }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-ui-text)' }}>
              Alien Status
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-ui-muted)' }}>
              {aliens.length} aliens{sickCount > 0 && ` · ${sickCount} sick`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-ui-text)' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable list */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-4 pt-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--color-ui-border) transparent',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            minHeight: 0,
          }}
        >
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {sortedAliens.map((alien) => (
                <AlienStatusRow
                  key={alien.id}
                  alien={alien}
                  onHeal={handleHeal}
                  onUpgrade={handleUpgrade}
                  energy={energy}
                />
              ))}
            </AnimatePresence>
          </div>

          {sortedAliens.length === 0 && (
            <div
              className="text-center py-8 text-sm"
              style={{ color: 'var(--color-ui-muted)' }}
            >
              No aliens alive
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
