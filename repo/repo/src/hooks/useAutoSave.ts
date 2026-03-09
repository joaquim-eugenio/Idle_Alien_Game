import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { PERSISTENCE } from '../lib/constants';

export function useAutoSave() {
  const getSerializableState = useGameStore((s) => s.getSerializableState);
  const loadState = useGameStore((s) => s.loadState);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    try {
      const raw = localStorage.getItem(PERSISTENCE.SAVE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        loadState(saved);
      }
    } catch {
      // Corrupted save, ignore
    }
  }, [loadState]);

  useEffect(() => {
    const save = () => {
      try {
        const state = getSerializableState();
        localStorage.setItem(PERSISTENCE.SAVE_KEY, JSON.stringify(state));
      } catch {
        // Storage full or unavailable
      }
    };

    const interval = setInterval(save, PERSISTENCE.SAVE_DEBOUNCE_MS);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', save);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', save);
      save();
    };
  }, [getSerializableState]);
}
