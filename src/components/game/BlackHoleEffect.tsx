import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

const DURATION_MS = 4000;

interface Particle {
  angle: number;
  radius: number;
  startRadius: number;
  angularSpeed: number;
  size: number;
  startSize: number;
  color: string;
}

function worldToScreen(
  wx: number, wy: number,
  cam: { offsetX: number; offsetY: number; scale: number },
): [number, number] {
  return [wx * cam.scale + cam.offsetX, wy * cam.scale + cam.offsetY];
}

function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
) {
  if (r < 1) return;

  // Outer red-orange glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.6);
  glow.addColorStop(0, 'rgba(0,0,0,0)');
  glow.addColorStop(0.45, 'rgba(200,50,0,0.12)');
  glow.addColorStop(0.7, 'rgba(180,30,0,0.06)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);

  // Red ring (outer accretion)
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = 'rgba(200,40,0,0.55)';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  // Orange ring
  ctx.lineWidth = r * 0.14;
  ctx.strokeStyle = 'rgba(255,120,10,0.65)';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  // Yellow ring
  ctx.lineWidth = r * 0.08;
  ctx.strokeStyle = 'rgba(255,220,60,0.8)';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.54, 0, Math.PI * 2);
  ctx.stroke();

  // Bright white-yellow photon ring
  ctx.lineWidth = r * 0.04;
  ctx.strokeStyle = 'rgba(255,255,200,0.95)';
  ctx.shadowColor = 'rgba(255,255,150,0.8)';
  ctx.shadowBlur = r * 0.12;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Horizontal jets (left and right) with curved edges
  for (const dir of [-1, 1]) {
    const jetLen = r * 0.9;
    const grad = ctx.createLinearGradient(cx, cy, cx + dir * jetLen, cy);
    grad.addColorStop(0, 'rgba(255,250,200,0.7)');
    grad.addColorStop(0.2, 'rgba(255,200,60,0.5)');
    grad.addColorStop(0.5, 'rgba(255,100,10,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx + dir * r * 0.45, cy - r * 0.10);
    ctx.quadraticCurveTo(cx + dir * jetLen * 0.6, cy - r * 0.06, cx + dir * jetLen, cy);
    ctx.quadraticCurveTo(cx + dir * jetLen * 0.6, cy + r * 0.06, cx + dir * r * 0.45, cy + r * 0.10);
    ctx.closePath();
    ctx.fill();
  }

  // Event horizon (black center)
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.44, 0, Math.PI * 2);
  ctx.fill();
}

interface BlackHoleEffectProps {
  cameraTransform: { offsetX: number; offsetY: number; scale: number };
}

export function BlackHoleEffect({ cameraTransform }: BlackHoleEffectProps) {
  const isActive = useGameStore((s) => s.isBlackHoleActive);
  const targets = useGameStore((s) => s.blackHoleTargets);
  const completeBlackHole = useGameStore((s) => s.completeBlackHole);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef(cameraTransform);
  cameraRef.current = cameraTransform;

  const finish = useCallback(() => {
    if (!doneRef.current) {
      doneRef.current = true;
      completeBlackHole();
    }
  }, [completeBlackHole]);

  // Build particles once on activation
  useEffect(() => {
    if (!isActive) {
      particlesRef.current = [];
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scrCx = vw / 2;
    const scrCy = vh / 2;
    const cam = cameraRef.current;
    const particles: Particle[] = [];

    for (const t of targets) {
      const [sx, sy] = worldToScreen(t.x, t.y, cam);
      const dx = sx - scrCx;
      const dy = sy - scrCy;
      const r = Math.max(Math.sqrt(dx * dx + dy * dy), 20);
      const a = Math.atan2(dy, dx);
      particles.push({
        angle: a,
        radius: r,
        startRadius: r,
        angularSpeed: 2 + Math.random() * 3,
        size: t.size,
        startSize: t.size,
        color: t.color,
      });
    }

    // Extra debris
    for (let i = 0; i < 25; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * Math.max(vw, vh) * 0.5;
      particles.push({
        angle: a, radius: r, startRadius: r,
        angularSpeed: 1.5 + Math.random() * 3,
        size: 2 + Math.random() * 2,
        startSize: 2 + Math.random() * 2,
        color: ['#ff6633', '#ffaa22', '#ff4422'][Math.floor(Math.random() * 3)],
      });
    }

    particlesRef.current = particles;
  }, [isActive, targets]);

  // Animation loop
  useEffect(() => {
    if (!isActive) {
      startRef.current = 0;
      doneRef.current = false;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) { finish(); return; }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;

    if (canvas.width === 0 || canvas.height === 0) { finish(); return; }

    startRef.current = 0;
    doneRef.current = false;

    // Safety timeout - force complete if animation glitches
    const safetyTimer = setTimeout(finish, DURATION_MS + 500);

    const loop = (time: number) => {
      if (doneRef.current) return;
      if (startRef.current === 0) startRef.current = time;

      const elapsed = time - startRef.current;
      const t = Math.min(elapsed / DURATION_MS, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) { finish(); return; }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      // --- Phase timing ---
      // 0.0-0.15 : open
      // 0.10-0.75: suction
      // 0.80-1.0 : close
      const openT = Math.min(t / 0.15, 1);
      const openEased = openT * openT * (3 - 2 * openT);
      const closeT = t > 0.80 ? (t - 0.80) / 0.20 : 0;
      const closeEased = closeT * closeT * (3 - 2 * closeT);
      const holeScale = openEased * (1 - closeEased);

      // Darken background
      if (holeScale > 0) {
        ctx.fillStyle = `rgba(0,0,0,${holeScale * 0.5})`;
        ctx.fillRect(0, 0, w, h);
      }

      // --- Suction particles ---
      const suctionStart = 0.10;
      const suctionEnd = 0.75;
      const sRaw = t < suctionStart ? 0 : t > suctionEnd ? 1 : (t - suctionStart) / (suctionEnd - suctionStart);
      const sEased = sRaw * sRaw;

      for (const p of particlesRef.current) {
        const frac = 1 - sEased; // 1 → 0
        const curRadius = p.startRadius * frac * dpr;
        const curSize = p.startSize * frac * dpr;

        if (curSize < 0.3 || curRadius < 2) continue;

        // Spin faster as radius shrinks
        const speedBoost = sEased < 0.99 ? 1 / Math.max(frac, 0.05) : 20;
        p.angle += p.angularSpeed * 0.016 * Math.min(speedBoost, 20);

        const px = cx + Math.cos(p.angle) * curRadius;
        const py = cy + Math.sin(p.angle) * curRadius;
        const alpha = Math.min(1, frac * 2);

        // Curved arc trail following the orbital path
        const trailSpan = (0.25 + sEased * 1.2) * (p.angularSpeed > 0 ? 1 : -1);
        const trailStartAngle = p.angle - trailSpan;

        if (curRadius > 3) {
          ctx.globalAlpha = alpha * 0.6;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = curSize * 0.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          if (trailSpan > 0) {
            ctx.arc(cx, cy, curRadius, trailStartAngle, p.angle);
          } else {
            ctx.arc(cx, cy, curRadius, p.angle, trailStartAngle);
          }
          ctx.stroke();
        }

        // Particle dot
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, curSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // --- Draw black hole ---
      const holeR = Math.min(w, h) * 0.15 * holeScale;
      drawBlackHole(ctx, cx, cy, holeR);

      // --- Done? ---
      if (t >= 1) {
        ctx.clearRect(0, 0, w, h);
        finish();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(safetyTimer);
    };
  }, [isActive, finish]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
}
