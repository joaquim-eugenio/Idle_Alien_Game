import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { formatEnergy } from '../../lib/utils';
import { SettingsModal } from './SettingsModal';
import { AlienStatusPanel } from './AlienStatusPanel';
import { DefeatedPopup } from './DefeatedPopup';
import { BlackHoleButton } from './BlackHoleButton';
import { useAdManager } from '../../hooks/useAdManager';

export function HUD() {
  const energy = useGameStore((s) => s.energy);
  const alienCount = useGameStore((s) => s.aliens.length);
  const totalBugsEaten = useGameStore((s) => s.totalBugsEaten);
  const sickCount = useGameStore((s) => s.aliens.filter((a) => a.hp < a.maxHp && !a.isDying).length);
  const pooCount = useGameStore((s) => s.poos.length);
  const clearAllPoos = useGameStore((s) => s.clearAllPoos);
  const { watchAdForAction } = useAdManager();
  const [showSettings, setShowSettings] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const handleCleanAll = () => {
    const adWatched = watchAdForAction();
    if (adWatched) {
      clearAllPoos();
    }
  };

  return (
    <>
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          background: 'linear-gradient(to bottom, rgba(10,10,26,0.9) 0%, transparent 100%)',
          paddingBottom: 16,
        }}
      >
        {/* Energy counter */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{
              background: 'var(--color-energy-green)',
              boxShadow: '0 0 12px var(--color-energy-glow)',
              color: '#000',
              fontWeight: 700,
            }}
          >
            E
          </div>
          <motion.span
            className="text-xl font-bold tabular-nums"
            style={{ color: 'var(--color-energy-green)', textShadow: '0 0 10px var(--color-energy-glow)' }}
            key={Math.floor(energy)}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {formatEnergy(energy)}
          </motion.span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-ui-muted)' }}>
            <span className="text-base">👾</span>
            <span className="tabular-nums font-medium">{alienCount}</span>
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-ui-muted)' }}>
            <span className="text-base">🐛</span>
            <span className="tabular-nums font-medium">{totalBugsEaten}</span>
          </div>
          {pooCount > 0 && (
            <motion.button
              className="h-8 rounded-full flex items-center gap-1 px-2.5 text-[11px] font-semibold active:scale-90 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 2px 8px rgba(139,92,246,0.35)',
              }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCleanAll}
            >
              <span>✨</span>
              <span>Clean</span>
              <span className="text-[9px] opacity-60">🎬</span>
            </motion.button>
          )}
          <button
            onClick={() => setShowStatus(true)}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform"
            style={{ background: 'var(--color-ui-surface)', color: 'var(--color-ui-text)' }}
          >
            📋
            {sickCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: '#ef4444',
                  color: 'white',
                  boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                }}
              >
                {sickCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform"
            style={{ background: 'var(--color-ui-surface)', color: 'var(--color-ui-text)' }}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Black Hole button - right side */}
      <div
        className="absolute z-30 flex flex-col items-center"
        style={{
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <BlackHoleButton />
      </div>

      <DefeatedPopup />

      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showStatus && <AlienStatusPanel onClose={() => setShowStatus(false)} />}
      </AnimatePresence>
    </>
  );
}
