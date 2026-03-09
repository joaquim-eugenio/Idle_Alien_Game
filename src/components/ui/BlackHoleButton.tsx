import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useAdManager } from '../../hooks/useAdManager';

export function BlackHoleButton() {
  const isBlackHoleActive = useGameStore((s) => s.isBlackHoleActive);
  const isTraveling = useGameStore((s) => s.isTraveling);
  const activateBlackHole = useGameStore((s) => s.activateBlackHole);
  const hasPredatorsOrPoos = useGameStore(
    (s) => s.poos.length > 0 || s.predatorBugs.length > 0,
  );
  const { watchAdForAction } = useAdManager();

  const disabled = isBlackHoleActive || isTraveling || !hasPredatorsOrPoos;

  const handlePress = () => {
    if (disabled) return;
    const adWatched = watchAdForAction();
    if (adWatched) {
      activateBlackHole();
    }
  };

  return (
    <motion.button
      className="flex flex-col items-center justify-center active:scale-90 transition-transform"
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: disabled
          ? 'rgba(30,30,63,0.5)'
          : 'linear-gradient(135deg, #1a0a2e 0%, #0d0d2b 50%, #2d0a1a 100%)',
        border: `1.5px solid ${disabled ? 'rgba(58,58,110,0.3)' : 'rgba(255,100,0,0.5)'}`,
        boxShadow: disabled
          ? 'none'
          : '0 0 12px rgba(255,80,0,0.25), inset 0 0 8px rgba(255,120,0,0.1)',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
      whileTap={disabled ? {} : { scale: 0.88 }}
      onClick={handlePress}
      disabled={disabled}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 30,
          height: 30,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #000 40%, #ff4400 70%, #ffcc00 100%)',
            boxShadow: disabled
              ? 'none'
              : '0 0 8px rgba(255,80,0,0.6), 0 0 16px rgba(255,50,0,0.3)',
            animation: disabled ? 'none' : 'bh-btn-pulse 2s ease-in-out infinite',
          }}
        />
      </div>
      <span
        className="text-[8px] font-semibold leading-none mt-0.5"
        style={{ color: disabled ? 'var(--color-ui-muted)' : '#ffaa44' }}
      >
        🎬
      </span>
    </motion.button>
  );
}
