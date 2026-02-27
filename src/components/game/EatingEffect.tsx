import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EatingEffectProps {
  x: number;
  y: number;
  active: boolean;
  color?: string;
}

const particles = Array.from({ length: 6 }, (_, i) => ({
  angle: (i * 60 * Math.PI) / 180,
  distance: 15 + Math.random() * 10,
  size: 3 + Math.random() * 3,
}));

export const EatingEffect = memo(function EatingEffect({ x, y, active, color = '#39ff14' }: EatingEffectProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute pointer-events-none"
          style={{ left: x, top: y, zIndex: 20 }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: color,
                boxShadow: `0 0 4px ${color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          ))}
          {/* Energy text */}
          <motion.div
            className="absolute text-xs font-bold whitespace-nowrap"
            style={{ color, textShadow: `0 0 6px ${color}`, left: -5, top: -15 }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            +E
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
