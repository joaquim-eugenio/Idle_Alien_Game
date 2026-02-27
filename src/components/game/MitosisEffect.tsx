import { motion } from 'framer-motion';

interface MitosisEffectProps {
  x: number;
  y: number;
  color: string;
  childX?: number;
  childY?: number;
}

export function MitosisEffect({ x, y, color, childX, childY }: MitosisEffectProps) {
  const dx = (childX ?? x) - x;
  const dy = (childY ?? y) - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: 9,
      }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      {/* Membrane bridge between parent and child */}
      {dist > 2 && (
        <motion.div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            height: 4,
            background: `linear-gradient(to right, ${color}88, ${color}44, ${color}88)`,
            borderRadius: '50%',
            transformOrigin: 'left center',
            transform: `rotate(${angle}deg) translateY(-50%)`,
          }}
          initial={{ width: 0, opacity: 0.8 }}
          animate={{ width: [0, Math.min(dist, 30), Math.min(dist, 30), 0], opacity: [0.8, 0.6, 0.4, 0] }}
          transition={{ duration: 1.0, ease: 'easeOut', times: [0, 0.3, 0.6, 1] }}
        />
      )}

      {/* Soft glow at separation point */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`,
        }}
        initial={{ width: 10, height: 10, opacity: 0.9 }}
        animate={{ width: 35, height: 35, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Wobbling membrane ring */}
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: `1.5px solid ${color}66`,
        }}
        initial={{
          width: 6, height: 6, opacity: 0.7,
          borderRadius: '40% 60% 55% 45% / 55% 40% 60% 45%',
        }}
        animate={{
          width: 45, height: 45, opacity: 0,
          borderRadius: ['40% 60% 55% 45% / 55% 40% 60% 45%', '55% 45% 40% 60% / 45% 55% 45% 55%', '50%'],
        }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      {/* Organic blob particles scattering from split point */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const pAngle = (i * Math.PI) / 3 + Math.random() * 0.5;
        const pDist = 12 + Math.random() * 10;
        const pDx = Math.cos(pAngle) * pDist;
        const pDy = Math.sin(pAngle) * pDist;
        const size = 2 + Math.random() * 2;
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: size,
              height: size,
              background: `radial-gradient(circle, ${color} 40%, ${color}88 100%)`,
            }}
            initial={{
              x: 0, y: 0, opacity: 0.8, scale: 1,
              borderRadius: '40% 60% 50% 50%',
            }}
            animate={{
              x: pDx, y: pDy, opacity: 0, scale: 0.3,
              borderRadius: '50%',
            }}
            transition={{ duration: 0.6 + i * 0.05, ease: 'easeOut', delay: 0.1 }}
          />
        );
      })}
    </motion.div>
  );
}
