import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { PERSISTENCE } from '../../lib/constants';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const totalEnergyEarned = useGameStore((s) => s.totalEnergyEarned);
  const totalBugsEaten = useGameStore((s) => s.totalBugsEaten);
  const totalReproductions = useGameStore((s) => s.totalReproductions);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleReset = () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      return;
    }
    useGameStore.getState().reset();
    localStorage.removeItem(PERSISTENCE.SAVE_KEY);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <motion.div
        className="relative w-[85%] max-w-xs rounded-2xl p-5"
        style={{
          background: 'var(--color-ui-surface)',
          border: '1px solid var(--color-ui-border)',
        }}
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-ui-text)' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-ui-text)' }}
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="mb-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-ui-muted)' }}>
            Statistics
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <StatItem label="Total Energy" value={Math.floor(totalEnergyEarned).toLocaleString()} />
            <StatItem label="Bugs Eaten" value={totalBugsEaten.toLocaleString()} />
            <StatItem label="Reproductions" value={totalReproductions.toLocaleString()} />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleReset}
            className="w-full py-2 px-4 rounded-xl text-sm font-medium active:scale-95 transition-transform"
            style={{
              background: isConfirmingReset ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: isConfirmingReset ? '#fff' : '#ef4444',
            }}
          >
            {isConfirmingReset ? 'Are you sure? (Click again)' : 'Reset Progress'}
          </button>
        </div>

        <p className="text-[10px] mt-3 text-center" style={{ color: 'var(--color-ui-muted)' }}>
          Idle Alien Tycoon v0.1.0
        </p>
      </motion.div>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-2 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      <div className="text-xs" style={{ color: 'var(--color-ui-muted)' }}>{label}</div>
      <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-ui-text)' }}>{value}</div>
    </div>
  );
}
