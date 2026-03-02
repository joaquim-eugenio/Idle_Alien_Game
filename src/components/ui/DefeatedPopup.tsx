import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { AlienMiniature } from './AlienMiniature';

const AUTO_DISMISS_MS = 3000;

export function DefeatedPopup() {
  const defeatedAlien = useGameStore((s) => s.defeatedAlien);
  const clearDefeatedAlien = useGameStore((s) => s.clearDefeatedAlien);

  useEffect(() => {
    if (!defeatedAlien) return;
    const timer = setTimeout(clearDefeatedAlien, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [defeatedAlien, clearDefeatedAlien]);

  return (
    <AnimatePresence>
      {defeatedAlien && (
        <motion.div
          className="fixed z-50 flex items-center justify-center"
          style={{ top: '30%', left: '50%', transform: 'translateX(-50%)' }}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -30 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={clearDefeatedAlien}
        >
          <div
            className="flex flex-col items-center gap-3 px-8 py-5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(30,10,40,0.95), rgba(60,15,20,0.95))',
              border: '1px solid rgba(239,68,68,0.4)',
              boxShadow: '0 0 40px rgba(239,68,68,0.2), 0 8px 32px rgba(0,0,0,0.6)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              className="rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(239,68,68,0.3)',
                width: 72,
                height: 72,
              }}
            >
              <AlienMiniature alien={defeatedAlien} size={64} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg">💀</span>
              <span
                className="text-base font-bold tracking-wide"
                style={{
                  color: '#ef4444',
                  textShadow: '0 0 12px rgba(239,68,68,0.5)',
                }}
              >
                Alien Defeated
              </span>
            </div>

            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Tap to dismiss
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
