import { useRef, useEffect, useCallback } from 'react';

interface StarTravelEffectProps {
  active: boolean;
  onComplete: () => void;
  duration?: number;
}

interface Star {
  angle: number;
  speed: number;
  dist: number;
  brightness: number;
  width: number;
}

const STAR_COUNT = 250;
const DEFAULT_DURATION = 2500;

function createStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      angle: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
      dist: Math.random() * 0.05,
      brightness: 0.5 + Math.random() * 0.5,
      width: 0.5 + Math.random() * 1.5,
    });
  }
  return stars;
}

export function StarTravelEffect({ active, onComplete, duration = DEFAULT_DURATION }: StarTravelEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const starsRef = useRef<Star[]>(createStars());
  const completedRef = useRef(false);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (startTimeRef.current === 0) startTimeRef.current = time;
    const elapsed = time - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.sqrt(cx * cx + cy * cy);

    ctx.fillStyle = `rgba(0, 0, 0, ${progress < 0.1 ? progress * 10 : 1})`;
    ctx.fillRect(0, 0, w, h);

    const rampUp = Math.min(progress / 0.15, 1);
    const fadeOut = progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1;
    const intensity = rampUp * fadeOut;

    const streakLength = intensity * maxDist * 0.8;

    for (const star of starsRef.current) {
      star.dist += star.speed * intensity * 0.025;
      if (star.dist > 1) star.dist -= 1;

      const d = star.dist * maxDist;
      const tailD = Math.max(0, d - streakLength * star.speed);

      const x1 = cx + Math.cos(star.angle) * d;
      const y1 = cy + Math.sin(star.angle) * d;
      const x2 = cx + Math.cos(star.angle) * tailD;
      const y2 = cy + Math.sin(star.angle) * tailD;

      const alpha = star.brightness * intensity * (0.3 + star.dist * 0.7);
      const blueShift = Math.round(200 + star.brightness * 55);

      ctx.strokeStyle = `rgba(${blueShift}, ${blueShift}, 255, ${alpha.toFixed(2)})`;
      ctx.lineWidth = star.width * (0.5 + intensity * 0.5);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    if (progress > 0.5) {
      const flashAlpha = progress > 0.6 ? Math.max(0, (0.8 - progress) * 5) : (progress - 0.5) * 10 * 0.3;
      ctx.fillStyle = `rgba(200, 220, 255, ${flashAlpha.toFixed(2)})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (progress >= 1) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return;
    }

    animRef.current = requestAnimationFrame(animate);
  }, [duration, onComplete]);

  useEffect(() => {
    if (!active) {
      startTimeRef.current = 0;
      completedRef.current = false;
      starsRef.current = createStars();
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    }

    startTimeRef.current = 0;
    completedRef.current = false;
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active, animate]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}
    />
  );
}
