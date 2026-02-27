import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'var(--color-space-dark)' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Alien icon */}
      <motion.div
        className="text-6xl mb-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      >
        👾
      </motion.div>

      {/* Title */}
      <motion.h1
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--color-ui-text)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        Idle Alien Tycoon
      </motion.h1>

      <motion.p
        className="text-sm mb-8"
        style={{ color: 'var(--color-ui-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Feed. Evolve. Dominate.
      </motion.p>

      {/* Play button */}
      <motion.button
        className="px-8 py-3 rounded-2xl text-lg font-bold active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, var(--color-energy-green), #00cc44)',
          color: '#000',
          boxShadow: '0 0 20px var(--color-energy-glow)',
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        whileTap={{ scale: 0.9 }}
        onClick={onComplete}
      >
        Play
      </motion.button>
    </motion.div>
  );
}
