import { useRef, useEffect, memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Bug, BugSpecies, BugType } from '../../lib/types';

// ═══════════════════════════════════════════════════════════════
// FLYWEIGHT: Shared color cache keyed by (species, quantizedHue)
// ═══════════════════════════════════════════════════════════════

interface BugColors { body: string; head: string; legs: string }

const colorCache = new Map<string, BugColors>();

const SPECIES_BASE: Record<BugSpecies, { body: string; head: string; legs: string }> = {
  ant:       { body: '#4ade80', head: '#22c55e', legs: '#16a34a' },
  beetle:    { body: '#8b5cf6', head: '#7c3aed', legs: '#6d28d9' },
  cricket:   { body: '#a3e635', head: '#84cc16', legs: '#65a30d' },
  centipede: { body: '#f97316', head: '#ea580c', legs: '#c2410c' },
  ladybug:   { body: '#ef4444', head: '#1a1a2e', legs: '#1a1a2e' },
};

function hexToHSL(hex: string): [number, number, number] {
  const m = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [0, 0, 50];
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0;
  const l = (mx + mn) / 2;
  let s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function shiftHex(hex: string, shift: number): string {
  const [h, s, l] = hexToHSL(hex);
  return `hsl(${Math.round(((h + shift) % 360 + 360) % 360)},${Math.round(s)}%,${Math.round(l)}%)`;
}

function getColors(species: BugSpecies, hueShift: number): BugColors {
  const key = `${species}:${Math.round(hueShift)}`;
  let c = colorCache.get(key);
  if (c) return c;
  const b = SPECIES_BASE[species];
  c = { body: shiftHex(b.body, hueShift), head: shiftHex(b.head, hueShift), legs: shiftHex(b.legs, hueShift) };
  colorCache.set(key, c);
  return c;
}

const GLOW: Record<BugType, { color: string; blur: number }> = {
  common: { color: 'transparent', blur: 0 },
  rare:   { color: 'rgba(56,189,248,0.4)', blur: 3 },
  golden: { color: 'rgba(251,191,36,0.5)', blur: 5 },
};

const DIMS: Record<BugSpecies, [number, number]> = {
  ant: [16, 20], beetle: [20, 20], cricket: [16, 24], centipede: [12, 28], ladybug: [16, 20],
};

// ═══════════════════════════════════════════════════════════════
// Canvas drawing primitives
// ═══════════════════════════════════════════════════════════════

const { sin, cos, PI, max, min, pow } = Math;
const DEG = PI / 180;

function ell(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, max(0.1, rx), max(0.1, ry), 0, 0, PI * 2);
  ctx.fill();
}

function circ(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, max(0.1, r), 0, PI * 2);
  ctx.fill();
}

function rg(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string, fx?: number, fy?: number): CanvasGradient {
  const g = ctx.createRadialGradient(fx ?? cx, fy ?? cy, 0, cx, cy, max(0.1, r));
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}

function drawLeg(ctx: CanvasRenderingContext2D, px: number, py: number, len: number, angleDeg: number, color: string, width = 0.6) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angleDeg * DEG);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, len);
  ctx.stroke();
  ctx.restore();
}

function drawAntenna(ctx: CanvasRenderingContext2D, bx: number, by: number, len: number, angleDeg: number, color: string) {
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angleDeg * DEG);
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -len);
  ctx.stroke();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// Per-species drawing functions (flyweight intrinsic state)
// All coordinates are in local space: (0,0) = top-left of the
// species bounding box, matching original CSS layout positions.
// ═══════════════════════════════════════════════════════════════

type DrawFn = (ctx: CanvasRenderingContext2D, s: number, phase: number, c: BugColors, glow: { color: string; blur: number }) => void;

const drawAnt: DrawFn = (ctx, s, phase, c, glow) => {
  const w = 8 * s, cx = w / 2;

  drawAntenna(ctx, cx - 1.5 * s, 1 * s, 2.5 * s, -25, c.legs);
  drawAntenna(ctx, cx + 1.5 * s, 1 * s, 2.5 * s, 25, c.legs);

  for (let i = 0; i < 3; i++) {
    const ly = (2 + i * 2) * s;
    const lS = sin(phase + i * PI / 3) * 18;
    const lE = cos(phase + i * PI / 3) * 0.8;
    const rS = sin(phase + i * PI / 3 + PI) * 18;
    const rE = cos(phase + i * PI / 3 + PI) * 0.8;
    drawLeg(ctx, 0, ly, (2.5 + lE) * s, -(35 + lS), c.legs);
    drawLeg(ctx, w, ly, (2.5 + rE) * s, 35 + rS, c.legs);
  }

  ctx.fillStyle = rg(ctx, cx, 6.75 * s, 2.25 * s, c.body, c.head);
  ell(ctx, cx, 6.75 * s, 2 * s, 2.25 * s);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx - 1.4 * s, 6.35 * s); ctx.lineTo(cx + 1.4 * s, 6.35 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 1.1 * s, 7.1 * s); ctx.lineTo(cx + 1.1 * s, 7.1 * s); ctx.stroke();

  ctx.fillStyle = rg(ctx, cx, 3.75 * s, 1.5 * s, c.body, c.head);
  ell(ctx, cx, 3.75 * s, 1.5 * s, 1.25 * s);

  ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur;
  ctx.fillStyle = rg(ctx, cx, 1.5 * s, 1.75 * s, c.head, c.body, cx * 0.8, 1.05 * s);
  ell(ctx, cx, 1.5 * s, 1.75 * s, 1.5 * s);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#111';
  circ(ctx, cx - 0.5 * s, 1.3 * s, 0.6 * s);
  circ(ctx, cx + 0.5 * s, 1.3 * s, 0.6 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  circ(ctx, cx - 0.65 * s, 1.15 * s, 0.18 * s);
  circ(ctx, cx + 0.35 * s, 1.15 * s, 0.18 * s);
};

const drawBeetle: DrawFn = (ctx, s, phase, c, glow) => {
  const w = 10 * s, cx = w / 2;

  for (let i = 0; i < 3; i++) {
    const swing = sin(phase + i * PI / 3) * 15;
    const ly = (3 + i * 2) * s;
    drawLeg(ctx, 1 * s, ly, 2.5 * s, -40 + swing, c.legs);
    drawLeg(ctx, w - 1 * s, ly, 2.5 * s, 40 - swing, c.legs);
  }

  ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur;
  const shCy = 5.5 * s;
  ctx.fillStyle = rg(ctx, cx, shCy, 4 * s, c.body, c.head, cx * 0.9, shCy * 0.7);
  ell(ctx, cx, shCy, 4 * s, 3.5 * s);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx, 2.7 * s); ctx.lineTo(cx, 8.3 * s); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ell(ctx, cx - 1 * s, shCy - 1.2 * s, 1 * s, 0.7 * s);

  ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur;
  ctx.fillStyle = rg(ctx, cx, 1.5 * s, 1.75 * s, c.head, c.legs, cx * 0.8, 1.05 * s);
  ell(ctx, cx, 1.5 * s, 1.75 * s, 1.5 * s);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#111';
  circ(ctx, cx - 0.6 * s, 1.4 * s, 0.6 * s);
  circ(ctx, cx + 0.6 * s, 1.4 * s, 0.6 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  circ(ctx, cx - 0.75 * s, 1.25 * s, 0.18 * s);
  circ(ctx, cx + 0.45 * s, 1.25 * s, 0.18 * s);
};

const drawCricket: DrawFn = (ctx, s, phase, c, glow) => {
  const w = 8 * s, cx = w / 2;

  drawAntenna(ctx, 2 * s, 0, 3 * s, -30, c.legs);
  drawAntenna(ctx, w - 2 * s, 0, 3 * s, 30, c.legs);

  const fl0 = sin(phase) * 12;
  const fl1 = sin(phase + PI) * 12;
  drawLeg(ctx, 0, 3 * s, 2 * s, -35 + fl0, c.legs);
  drawLeg(ctx, w, 4 * s, 2 * s, 35 - fl1, c.legs);

  const hl = sin(phase) * 10;
  const hr = sin(phase + PI) * 10;
  drawLeg(ctx, -1 * s, 7 * s, 4 * s, -(50 + hl), c.legs, 0.8);
  drawLeg(ctx, w + 1 * s, 7 * s, 4 * s, 50 + hr, c.legs, 0.8);

  const bcy = 6 * s;
  ctx.fillStyle = rg(ctx, cx, bcy, 4 * s, c.body, c.head, cx, bcy * 0.6);
  ell(ctx, cx, bcy, 2 * s, 4 * s);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx - 1.2 * s, 4.8 * s); ctx.lineTo(cx + 1.2 * s, 4.8 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 1 * s, 6.8 * s); ctx.lineTo(cx + 1 * s, 6.8 * s); ctx.stroke();

  ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur;
  ctx.fillStyle = rg(ctx, cx, 1.25 * s, 1.5 * s, c.head, c.body, cx * 0.8, 0.9 * s);
  ell(ctx, cx, 1.25 * s, 1.5 * s, 1.25 * s);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#111';
  circ(ctx, cx - 0.5 * s, 1.1 * s, 0.6 * s);
  circ(ctx, cx + 0.5 * s, 1.1 * s, 0.6 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  circ(ctx, cx - 0.65 * s, 0.95 * s, 0.18 * s);
  circ(ctx, cx + 0.35 * s, 0.95 * s, 0.18 * s);
};

const drawCentipede: DrawFn = (ctx, s, phase, c, glow) => {
  const w = 6 * s, cx = w / 2;
  const segN = 5;

  for (let i = segN - 1; i >= 0; i--) {
    const segY = (2.2 + i * 2.2) * s;
    const sway = sin(phase * 0.8 + i * 0.6) * 2.4;
    const lsw = sin(phase + i * PI / segN) * 20;
    drawLeg(ctx, sway, segY + 0.3 * s, 1.8 * s, -45 + lsw, c.legs, 0.5);
    drawLeg(ctx, w + sway, segY + 0.3 * s, 1.8 * s, 45 - lsw, c.legs, 0.5);
    const segW = (3 - i * 0.15) * s;
    ctx.fillStyle = rg(ctx, cx + sway, segY + 1 * s, segW * 0.55, i % 2 === 0 ? c.body : c.head, c.legs);
    ell(ctx, cx + sway, segY + 1 * s, segW / 2, 1 * s);
  }

  drawAntenna(ctx, cx - 1 * s, 0, 2 * s, -35, c.legs);
  drawAntenna(ctx, cx + 1 * s, 0, 2 * s, 35, c.legs);

  ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur;
  ctx.fillStyle = rg(ctx, cx, 1.25 * s, 1.75 * s, c.head, c.body, cx * 0.8, 0.9 * s);
  ell(ctx, cx, 1.25 * s, 1.75 * s, 1.25 * s);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#111';
  circ(ctx, cx - 0.45 * s, 1.1 * s, 0.5 * s);
  circ(ctx, cx + 0.45 * s, 1.1 * s, 0.5 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  circ(ctx, cx - 0.6 * s, 0.95 * s, 0.15 * s);
  circ(ctx, cx + 0.3 * s, 0.95 * s, 0.15 * s);
};

const drawLadybug: DrawFn = (ctx, s, phase, c, glow) => {
  const w = 8 * s, cx = w / 2;

  for (let i = 0; i < 3; i++) {
    const swing = sin(phase + i * PI / 3) * 15;
    const ly = (2.5 + i * 1.8) * s;
    drawLeg(ctx, 0.5 * s, ly, 2 * s, -40 + swing, c.legs, 0.5);
    drawLeg(ctx, w - 0.5 * s, ly, 2 * s, 40 - swing, c.legs, 0.5);
  }

  ctx.shadowColor = glow.color; ctx.shadowBlur = glow.blur;
  const shCy = 4.75 * s;
  ctx.fillStyle = rg(ctx, cx, shCy, 3.5 * s, c.body, c.body, cx * 0.9, shCy * 0.7);
  ell(ctx, cx, shCy, 3.5 * s, 3.25 * s);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx, 2 * s); ctx.lineTo(cx, 7.5 * s); ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  const sl = cx - 3.5 * s, st = shCy - 3.25 * s, sw = 7 * s, sh = 6.5 * s;
  for (const [sx, sy] of [[0.25, 0.30], [0.70, 0.25], [0.20, 0.60], [0.75, 0.55], [0.45, 0.70]]) {
    circ(ctx, sl + sx * sw, st + sy * sh, 0.75 * s);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ell(ctx, sl + 0.22 * sw, st + 0.12 * sh, 0.7 * s, 0.58 * s);

  const hcy = 1 * s;
  ctx.fillStyle = c.head;
  ell(ctx, cx, hcy, 1.25 * s, 1 * s);
  ctx.fillStyle = '#fff';
  circ(ctx, cx - 0.45 * s, hcy - 0.1 * s, 0.5 * s);
  circ(ctx, cx + 0.45 * s, hcy - 0.1 * s, 0.5 * s);
  ctx.fillStyle = '#111';
  circ(ctx, cx - 0.35 * s, hcy, 0.25 * s);
  circ(ctx, cx + 0.35 * s, hcy, 0.25 * s);
};

const DRAW_FNS: Record<BugSpecies, DrawFn> = {
  ant: drawAnt, beetle: drawBeetle, cricket: drawCricket,
  centipede: drawCentipede, ladybug: drawLadybug,
};

// ═══════════════════════════════════════════════════════════════
// Per-bug draw call (applies transforms, delegates to species fn)
// ═══════════════════════════════════════════════════════════════

const SPAWN_MS = 300;

function renderBug(ctx: CanvasRenderingContext2D, bug: Bug, now: number) {
  const c = getColors(bug.species, bug.hueShift);
  const glow = GLOW[bug.type];
  const s = bug.sizeScale * 0.85;
  const [bw, bh] = DIMS[bug.species];
  const rotation = bug.angle + PI / 2;

  const age = now - bug.spawnedAt;
  let sc = 1, alpha = 1;
  if (age < SPAWN_MS) {
    const t = age / SPAWN_MS;
    sc = 1 - pow(1 - t, 3);
    alpha = min(1, t * 3);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(bug.x, bug.y);
  ctx.rotate(rotation);
  ctx.scale(sc, sc);
  ctx.translate(-(bw * s) / 2, -(bh * s) / 2);

  DRAW_FNS[bug.species](ctx, s, bug.walkPhase, c, glow);

  if (bug.type === 'golden') {
    const pulse = 0.5 + 0.5 * sin(now * 0.004 * PI);
    ctx.globalAlpha = 0.15 * pulse;
    ctx.fillStyle = 'rgba(255,215,0,0.3)';
    circ(ctx, (bw * s) / 2, (bh * s) / 2, max(bw, bh) * s * 0.6);
  }

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
// React Component
// ═══════════════════════════════════════════════════════════════

interface VisBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface BugCanvasProps {
  width: number;
  height: number;
  visBounds?: VisBounds;
}

export const BugCanvas = memo(function BugCanvas({ width, height, visBounds }: BugCanvasProps) {
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
      const currentBugs = useGameStore.getState().bugs;
      const vb = boundsRef.current;
      for (let i = 0; i < currentBugs.length; i++) {
        const bug = currentBugs[i];
        if (vb && (bug.x < vb.left || bug.x > vb.right || bug.y < vb.top || bug.y > vb.bottom)) continue;
        renderBug(ctx, bug, now);
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
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 5, pointerEvents: 'none' }}
    />
  );
});
