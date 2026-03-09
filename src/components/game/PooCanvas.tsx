import { useRef, useEffect, memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Poo } from '../../lib/types';
import { HEALTH } from '../../lib/constants';

const { sin, cos, PI, max, min } = Math;

const POO_SIZE = 14;
const SPAWN_MS = 300;
const STINK_WAVE_COUNT = 3;

const gradientCache = new Map<string, { inner: string; outer: string }>();

function getPooGradientColors(alienColor: string): { inner: string; outer: string } {
  const quantized = alienColor.slice(0, 5);
  let c = gradientCache.get(quantized);
  if (c) return c;
  c = { inner: '#8B6914', outer: '#5C3D00' };
  gradientCache.set(quantized, c);
  return c;
}

function renderDangerZone(ctx: CanvasRenderingContext2D, poo: Poo, now: number) {
  const r = HEALTH.POO_DAMAGE_RADIUS;
  const cx = poo.x + POO_SIZE / 2;
  const cy = poo.y + POO_SIZE / 2;

  const pulseT = (now % 2500) / 2500;
  const pulse = 0.5 + 0.5 * sin(pulseT * PI * 2);
  const baseAlpha = 0.05 + pulse * 0.04;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, `rgba(100, 180, 40, ${baseAlpha * 1.8})`);
  grad.addColorStop(0.5, `rgba(80, 140, 30, ${baseAlpha})`);
  grad.addColorStop(1, 'rgba(60, 100, 20, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(120, 200, 50, ${baseAlpha * 2.5})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -now * 0.015;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderPoo(ctx: CanvasRenderingContext2D, poo: Poo, now: number) {
  const age = now - poo.spawnedAt;
  const colors = getPooGradientColors(poo.alienColor);

  let sc = 1;
  let alpha = 1;
  if (age < SPAWN_MS) {
    const t = age / SPAWN_MS;
    const eased = 1 - (1 - t) * (1 - t) * (1 - t);
    sc = eased * 1.1;
    if (sc > 1) sc = 1 + (1.1 - 1) * (1 - (t - 0.7) / 0.3);
    sc = max(0.01, min(1, eased));
    alpha = min(1, t * 3);
  }

  const r = POO_SIZE / 2;
  const cx = poo.x + r;
  const cy = poo.y + r;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(sc, sc);

  // Stink wave lines
  const stinkAlpha = 0.5 + 0.2 * sin(now * 0.003);
  ctx.strokeStyle = `rgba(140, 180, 40, ${stinkAlpha})`;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';

  for (let i = 0; i < STINK_WAVE_COUNT; i++) {
    const xOff = -6 + i * 6;
    const wavePhase = now * 0.004 + i * 1.3;
    const waveHeight = 8 + sin(wavePhase) * 3;
    const sway = sin(wavePhase * 1.2) * 2;

    ctx.beginPath();
    ctx.moveTo(xOff, -r);
    ctx.quadraticCurveTo(xOff + sway, -r - waveHeight * 0.5, xOff + sway * 0.5, -r - waveHeight);
    ctx.stroke();
  }

  // Brown poo circle with radial gradient
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  grad.addColorStop(0, colors.inner);
  grad.addColorStop(1, colors.outer);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, PI * 2);
  ctx.fill();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.6, r * 0.7, r * 0.2, 0, 0, PI * 2);
  ctx.fill();

  // Highlight spot
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, -r * 0.25, r * 0.35, r * 0.25, -0.3, 0, PI * 2);
  ctx.fill();

  ctx.restore();
}

interface VisBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface PooCanvasProps {
  width: number;
  height: number;
  visBounds?: VisBounds;
}

export const PooCanvas = memo(function PooCanvas({ width, height, visBounds }: PooCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boundsRef = useRef(visBounds);
  boundsRef.current = visBounds;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const render = () => {
      const now = Date.now();
      ctx.clearRect(0, 0, width, height);
      const currentPoos = useGameStore.getState().poos;
      const vb = boundsRef.current;
      for (let i = 0; i < currentPoos.length; i++) {
        const poo = currentPoos[i];
        if (vb && (poo.x < vb.left - HEALTH.POO_DAMAGE_RADIUS || poo.x > vb.right + HEALTH.POO_DAMAGE_RADIUS || poo.y < vb.top - HEALTH.POO_DAMAGE_RADIUS || poo.y > vb.bottom + HEALTH.POO_DAMAGE_RADIUS)) continue;
        renderDangerZone(ctx, poo, now);
      }
      for (let i = 0; i < currentPoos.length; i++) {
        const poo = currentPoos[i];
        if (vb && (poo.x < vb.left || poo.x > vb.right || poo.y < vb.top || poo.y > vb.bottom)) continue;
        renderPoo(ctx, poo, now);
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 6, pointerEvents: 'none' }}
    />
  );
});
