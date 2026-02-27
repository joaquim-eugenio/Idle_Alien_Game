import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { CameraState } from '../lib/types';

const MIN_SCALE = 0.3;

export function useCamera(viewportWidth: number, viewportHeight: number): CameraState {
  const aliens = useGameStore((s) => s.aliens);
  const worldSize = useGameStore((s) => s.worldSize);

  return useMemo(() => {
    if (aliens.length === 0) {
      const fitScaleX = viewportWidth / worldSize.width;
      const fitScaleY = viewportHeight / worldSize.height;
      const fitScale = Math.max(Math.min(Math.min(fitScaleX, fitScaleY), 1), MIN_SCALE);
      return {
        scale: fitScale,
        offsetX: (viewportWidth - worldSize.width * fitScale) / 2,
        offsetY: (viewportHeight - worldSize.height * fitScale) / 2,
      };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const alien of aliens) {
      if (alien.x < minX) minX = alien.x;
      if (alien.x > maxX) maxX = alien.x;
      if (alien.y < minY) minY = alien.y;
      if (alien.y > maxY) maxY = alien.y;
    }

    const padding = 80;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const boundsWidth = Math.max(maxX - minX, viewportWidth * 0.5);
    const boundsHeight = Math.max(maxY - minY, viewportHeight * 0.5);

    const scaleX = viewportWidth / boundsWidth;
    const scaleY = viewportHeight / boundsHeight;
    const scale = Math.max(Math.min(Math.min(scaleX, scaleY), 1), MIN_SCALE);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const offsetX = viewportWidth / 2 - centerX * scale;
    const offsetY = viewportHeight / 2 - centerY * scale;

    const scaledWorldW = worldSize.width * scale;
    const scaledWorldH = worldSize.height * scale;

    let clampedOffsetX: number;
    let clampedOffsetY: number;

    if (scaledWorldW <= viewportWidth) {
      clampedOffsetX = (viewportWidth - scaledWorldW) / 2;
    } else {
      clampedOffsetX = Math.max(Math.min(offsetX, 0), viewportWidth - scaledWorldW);
    }

    if (scaledWorldH <= viewportHeight) {
      clampedOffsetY = (viewportHeight - scaledWorldH) / 2;
    } else {
      clampedOffsetY = Math.max(Math.min(offsetY, 0), viewportHeight - scaledWorldH);
    }

    return {
      scale,
      offsetX: clampedOffsetX,
      offsetY: clampedOffsetY,
    };
  }, [aliens, worldSize, viewportWidth, viewportHeight]);
}
