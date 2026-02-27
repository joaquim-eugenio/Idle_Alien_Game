import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

interface FartEffectProps {
  x: number;
  y: number;
  facingAngle: number;
  color: string;
}

const FART_DURATION = 1.2;

export const FartEffect = memo(function FartEffect({ x, y, facingAngle, color }: FartEffectProps) {
  const behindAngle = facingAngle + Math.PI;

  const puffs = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const spread = (Math.random() - 0.5) * 1.4;
      const angle = behindAngle + spread;
      const dist = 14 + Math.random() * 24;
      const size = 10 + Math.random() * 14;
      return {
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        size,
        delay: i * 0.05 + Math.random() * 0.04,
        duration: FART_DURATION * (0.7 + Math.random() * 0.3),
      };
    }), [behindAngle]);

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, zIndex: 4 }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: FART_DURATION, ease: 'easeOut' }}
    >
      {puffs.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: -p.size / 2,
            top: -p.size / 2,
            background: `radial-gradient(circle, ${color}99 0%, ${color}55 50%, transparent 100%)`,
            filter: 'blur(3px)',
          }}
          initial={{ x: 0, y: 0, scale: 0.5, opacity: 0.85 }}
          animate={{
            x: p.tx,
            y: p.ty,
            scale: 2.5,
            opacity: 0,
          }}
          transition={{
            duration: p.duration,
            ease: 'easeOut',
            delay: p.delay,
          }}
        />
      ))}
    </motion.div>
  );
});
