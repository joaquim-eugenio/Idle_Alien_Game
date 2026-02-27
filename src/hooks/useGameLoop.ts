import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameLoop() {
  const tick = useGameStore((s) => s.tick);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let rafId: number;

    const loop = (now: number) => {
      const delta = (now - lastTime.current) / 1000;
      lastTime.current = now;
      tick(Math.min(delta, 0.1));
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tick]);
}
