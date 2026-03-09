import { useRef, useEffect, memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { PredatorBug } from '../../lib/types';
import { PREDATOR } from '../../lib/constants';
import { getArchetype } from '../../lib/predatorArchetypes';
import type { PredatorArchetype, PredatorColorPalette } from '../../lib/predatorArchetypes';

const colorCache = new Map<string, PredatorColorPalette>();

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

function getColors(archetype: PredatorArchetype, hueShift: number): PredatorColorPalette {
  const key = `${archetype.id}:${Math.round(hueShift)}`;
  let c = colorCache.get(key);
  if (c) return c;
  const b = archetype.palette;
  c = {
    body: shiftHex(b.body, hueShift),
    head: shiftHex(b.head, hueShift),
    limbs: shiftHex(b.limbs, hueShift),
    accent: shiftHex(b.accent, hueShift),
  };
  colorCache.set(key, c);
  return c;
}

const { sin, cos, PI, max, min, pow, abs } = Math;
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

function rg(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c1: string, c2: string): CanvasGradient {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, max(0.1, r));
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  return g;
}

function drawLimb(ctx: CanvasRenderingContext2D, px: number, py: number, len: number, angleDeg: number, color: string, width = 1) {
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

function drawClaw(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, angleDeg: number, color: string) {
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angleDeg * DEG);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.3, -size);
  ctx.lineTo(size * 0.15, -size * 0.7);
  ctx.lineTo(size * 0.3, -size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawProceduralPredator(ctx: CanvasRenderingContext2D, s: number, phase: number, c: PredatorColorPalette, arch: PredatorArchetype) {
  const w = 16 * s, cx = w / 2;

  // Draw Legs
  let legPairs = 3;
  let legLen = 3 * s;
  let legWidth = 1;
  let legSpread = 45;
  let legStartY = 6 * s;
  let legSpacing = 2 * s;

  if (arch.legStyle === 'spider') { legPairs = 4; legLen = 3.5 * s; legSpread = 55; legStartY = 4 * s; }
  else if (arch.legStyle === 'thick') { legLen = 3.5 * s; legWidth = 1.5; legSpread = 50; legStartY = 7 * s; }
  else if (arch.legStyle === 'spindly') { legPairs = 4; legLen = 4.5 * s; legWidth = 0.8; legSpread = 60; legStartY = 5 * s; }

  for (let i = 0; i < legPairs; i++) {
    const swing = sin(phase + i * PI / legPairs) * 15;
    const ly = legStartY + i * legSpacing;
    drawLimb(ctx, 1.5 * s, ly, legLen, -legSpread + swing, c.limbs, legWidth);
    drawLimb(ctx, w - 1.5 * s, ly, legLen, legSpread - swing, c.limbs, legWidth);
  }

  // Draw Wings
  if (arch.wingStyle === 'translucent') {
    ctx.globalAlpha = 0.2 + sin(phase * 4) * 0.05;
    ctx.fillStyle = c.accent;
    ctx.save(); ctx.translate(cx - 2 * s, 5 * s); ctx.rotate(-15 * DEG); ell(ctx, 0, 0, 4 * s, 2 * s); ctx.restore();
    ctx.save(); ctx.translate(cx + 2 * s, 5 * s); ctx.rotate(15 * DEG); ell(ctx, 0, 0, 4 * s, 2 * s); ctx.restore();
    ctx.globalAlpha = 1;
  } else if (arch.wingStyle === 'beetle') {
    ctx.fillStyle = c.accent;
    const wingOpen = abs(sin(phase * 2)) * 10;
    ctx.save(); ctx.translate(cx - 1 * s, 4 * s); ctx.rotate(-wingOpen * DEG); ell(ctx, -1 * s, 3 * s, 2 * s, 4 * s); ctx.restore();
    ctx.save(); ctx.translate(cx + 1 * s, 4 * s); ctx.rotate(wingOpen * DEG); ell(ctx, 1 * s, 3 * s, 2 * s, 4 * s); ctx.restore();
  }

  // Draw Body
  if (arch.bodyShape === 'segmented') {
    ctx.fillStyle = rg(ctx, cx, 10 * s, 4 * s, c.body, c.head); ell(ctx, cx, 10 * s, 3 * s, 4 * s);
    ctx.fillStyle = rg(ctx, cx, 6 * s, 2.5 * s, c.body, c.head); ell(ctx, cx, 6 * s, 2.5 * s, 2 * s);
  } else if (arch.bodyShape === 'armored') {
    ctx.fillStyle = rg(ctx, cx, 8.5 * s, 5 * s, c.body, c.head); ell(ctx, cx, 8.5 * s, 5 * s, 5 * s);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 3 * s, 7 * s); ctx.lineTo(cx + 3 * s, 7 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 2.5 * s, 9.5 * s); ctx.lineTo(cx + 2.5 * s, 9.5 * s); ctx.stroke();
  } else if (arch.bodyShape === 'spider') {
    ctx.fillStyle = rg(ctx, cx, 9 * s, 4 * s, c.body, c.head); ell(ctx, cx, 9 * s, 4 * s, 3.5 * s);
    ctx.fillStyle = rg(ctx, cx, 4.5 * s, 3 * s, c.body, c.head); ell(ctx, cx, 4.5 * s, 3 * s, 2.5 * s);
  } else if (arch.bodyShape === 'narrow') {
    ctx.fillStyle = rg(ctx, cx, 7 * s, 3 * s, c.body, c.head); ell(ctx, cx, 7 * s, 2 * s, 4.5 * s);
  } else if (arch.bodyShape === 'bulky') {
    ctx.fillStyle = rg(ctx, cx, 7 * s, 5 * s, c.body, c.head); ell(ctx, cx, 7 * s, 4.5 * s, 5 * s);
  }

  // Draw Pattern
  if (arch.pattern === 'striped') {
    ctx.strokeStyle = c.accent;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(cx - 2 * s, 7 * s); ctx.lineTo(cx + 2 * s, 7 * s);
    ctx.moveTo(cx - 2.5 * s, 9 * s); ctx.lineTo(cx + 2.5 * s, 9 * s);
    ctx.moveTo(cx - 2 * s, 11 * s); ctx.lineTo(cx + 2 * s, 11 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (arch.pattern === 'spotted') {
    ctx.fillStyle = c.accent;
    ctx.globalAlpha = 0.5;
    circ(ctx, cx, 8 * s, 1.5 * s);
    circ(ctx, cx - 1.5 * s, 10 * s, 1 * s);
    circ(ctx, cx + 1.5 * s, 10 * s, 1 * s);
    ctx.globalAlpha = 1;
  }

  // Draw Head
  let headY = 2.5 * s;
  if (arch.headShape === 'round') {
    ctx.fillStyle = rg(ctx, cx, headY, 2.5 * s, c.head, c.limbs); ell(ctx, cx, headY, 2.5 * s, 2 * s);
  } else if (arch.headShape === 'triangular') {
    ctx.fillStyle = rg(ctx, cx, headY, 2 * s, c.head, c.limbs);
    ctx.beginPath(); ctx.moveTo(cx, 0.5 * s); ctx.lineTo(cx - 2 * s, 3.5 * s); ctx.lineTo(cx + 2 * s, 3.5 * s); ctx.closePath(); ctx.fill();
  } else if (arch.headShape === 'wide') {
    ctx.fillStyle = rg(ctx, cx, 3.5 * s, 3 * s, c.head, c.limbs); ell(ctx, cx, 3.5 * s, 3.5 * s, 2.5 * s);
    headY = 3.5 * s;
  }

  // Draw Arms
  const armSwing = sin(phase * 1.5) * 10;
  if (arch.armStyle === 'claws') {
    drawLimb(ctx, cx - 2 * s, 4 * s, 4 * s, -70 + armSwing, c.accent, 1.5);
    drawClaw(ctx, cx - 2 * s + cos((-70 + armSwing) * DEG) * 0.1, 4 * s + sin((-70 + armSwing) * DEG) * (-4 * s), 2.5 * s, -70 + armSwing, c.accent);
    drawLimb(ctx, cx + 2 * s, 4 * s, 4 * s, 70 - armSwing, c.accent, 1.5);
    drawClaw(ctx, cx + 2 * s + cos((70 - armSwing) * DEG) * 0.1, 4 * s + sin((70 - armSwing) * DEG) * (-4 * s), 2.5 * s, 70 - armSwing, c.accent);
  } else if (arch.armStyle === 'pincers') {
    drawLimb(ctx, cx - 3 * s, 5 * s, 5 * s, -80 + armSwing, c.accent, 2);
    drawClaw(ctx, cx - 3 * s - sin((80 - armSwing) * DEG) * 5 * s, 5 * s - cos((80 - armSwing) * DEG) * 5 * s, 3.5 * s, -60 + armSwing, c.accent);
    drawLimb(ctx, cx + 3 * s, 5 * s, 5 * s, 80 - armSwing, c.accent, 2);
    drawClaw(ctx, cx + 3 * s + sin((80 - armSwing) * DEG) * 5 * s, 5 * s - cos((80 - armSwing) * DEG) * 5 * s, 3.5 * s, 60 - armSwing, c.accent);
  } else if (arch.armStyle === 'blades') {
    ctx.save(); ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.translate(cx - 2 * s, 3.5 * s); ctx.rotate((-80 + armSwing) * DEG);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6 * s); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(-0.5 * s, -6 * s); ctx.lineTo(0, -7.5 * s); ctx.lineTo(0.5 * s, -6 * s); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = c.accent; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.translate(cx + 2 * s, 3.5 * s); ctx.rotate((80 - armSwing) * DEG);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6 * s); ctx.stroke();
    ctx.fillStyle = c.accent; ctx.beginPath(); ctx.moveTo(-0.5 * s, -6 * s); ctx.lineTo(0, -7.5 * s); ctx.lineTo(0.5 * s, -6 * s); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (arch.armStyle === 'tentacles') {
    for (let side = -1; side <= 1; side += 2) {
      ctx.save(); ctx.translate(cx + side * 2 * s, 4.5 * s); ctx.rotate((side * (60 - armSwing)) * DEG);
      ctx.strokeStyle = c.accent; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(side * 1 * s, -2 * s, side * 0.5 * s, -4 * s, side * -0.5 * s, -5 * s);
      ctx.stroke(); ctx.restore();
    }
  }

  // Draw Eyes
  if (arch.eyeStyle === 'compound') {
    ctx.fillStyle = '#00CC44'; circ(ctx, cx - 1.2 * s, headY - 0.5 * s, 0.9 * s); circ(ctx, cx + 1.2 * s, headY - 0.5 * s, 0.9 * s);
    ctx.fillStyle = '#003311'; circ(ctx, cx - 1.2 * s, headY - 0.5 * s, 0.4 * s); circ(ctx, cx + 1.2 * s, headY - 0.5 * s, 0.4 * s);
  } else if (arch.eyeStyle === 'spider') {
    ctx.fillStyle = '#FF2222';
    circ(ctx, cx - 1 * s, headY - 1.2 * s, 0.6 * s); circ(ctx, cx + 1 * s, headY - 1.2 * s, 0.6 * s);
    circ(ctx, cx - 0.4 * s, headY - 1.5 * s, 0.45 * s); circ(ctx, cx + 0.4 * s, headY - 1.5 * s, 0.45 * s);
    ctx.fillStyle = '#111';
    circ(ctx, cx - 1 * s, headY - 1.2 * s, 0.25 * s); circ(ctx, cx + 1 * s, headY - 1.2 * s, 0.25 * s);
  } else if (arch.eyeStyle === 'cyclops') {
    ctx.fillStyle = '#FFEECC'; circ(ctx, cx, headY, 1.5 * s);
    ctx.fillStyle = c.accent; circ(ctx, cx, headY, 1 * s);
    ctx.fillStyle = '#220011'; circ(ctx, cx, headY, 0.5 * s);
  } else if (arch.eyeStyle === 'slit') {
    ctx.fillStyle = '#FFCC00';
    ctx.save(); ctx.translate(cx - 1 * s, headY - 0.5 * s); ctx.rotate(-20 * DEG); ell(ctx, 0, 0, 0.8 * s, 0.3 * s); ctx.restore();
    ctx.save(); ctx.translate(cx + 1 * s, headY - 0.5 * s); ctx.rotate(20 * DEG); ell(ctx, 0, 0, 0.8 * s, 0.3 * s); ctx.restore();
  }
}

const SPAWN_MS = 500;

function drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, hp: number, maxHp: number, barWidth: number) {
  const barHeight = 3;
  const bx = x - barWidth / 2;
  const by = y - 2;
  const ratio = max(0, min(1, hp / maxHp));

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(bx - 1, by - 1, barWidth + 2, barHeight + 2);

  const r = Math.round(255 * (1 - ratio));
  const g = Math.round(200 * ratio);
  ctx.fillStyle = `rgb(${r},${g},40)`;
  const fillW = barWidth * ratio;
  if (fillW > 0.5) {
    ctx.fillRect(bx, by, fillW, barHeight);
  }
}

function renderPredator(ctx: CanvasRenderingContext2D, pred: PredatorBug, now: number) {
  const archetype = getArchetype(pred.archetypeId);
  if (!archetype) return;

  const c = getColors(archetype, pred.hueShift);
  const s = pred.sizeScale * 0.85;
  const bw = 30;
  const bh = 30;
  const rotation = pred.angle + PI / 2;

  const age = now - pred.spawnedAt;
  let sc = 1, alpha = 1;
  if (age < SPAWN_MS) {
    const t = age / SPAWN_MS;
    sc = 1 - pow(1 - t, 3);
    alpha = min(1, t * 2);
  }

  if (pred.hp <= 0) {
    const deathAge = now - pred.lastDamageTime;
    const deathT = min(1, deathAge / PREDATOR.DEATH_ANIM_MS);
    sc *= 1 - deathT;
    alpha *= 1 - deathT;
    if (alpha <= 0) return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(pred.x, pred.y);

  if (pred.hp > 0) {
    const barWidth = bw * s * 0.7;
    drawHpBar(ctx, 0, -(bh * s) / 2 - 4, pred.hp, pred.maxHp, barWidth);
  }

  ctx.rotate(rotation);
  ctx.scale(sc, sc);
  ctx.translate(-(bw * s) / 2, -(bh * s) / 2);

  const timeSinceDamage = now - pred.lastDamageTime;
  if (timeSinceDamage < PREDATOR.DAMAGE_FLASH_MS && pred.hp > 0) {
    const shakeDecay = 1 - timeSinceDamage / PREDATOR.DAMAGE_FLASH_MS;
    const shakeAmp = 3 * shakeDecay;
    ctx.translate(
      (Math.random() - 0.5) * shakeAmp * 2,
      (Math.random() - 0.5) * shakeAmp * 2,
    );
    ctx.shadowColor = 'rgba(255,0,0,0.8)';
    ctx.shadowBlur = 8;
  } else {
    ctx.shadowColor = 'rgba(255,0,0,0.15)';
    ctx.shadowBlur = 4;
  }

  drawProceduralPredator(ctx, s, pred.walkPhase, c, archetype);

  ctx.shadowBlur = 0;

  if (timeSinceDamage < PREDATOR.DAMAGE_FLASH_MS && pred.hp > 0) {
    const flashAlpha = 0.3 * (1 - timeSinceDamage / PREDATOR.DAMAGE_FLASH_MS);
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = '#FF0000';
    ell(ctx, (bw * s) / 2, (bh * s) / 2, (bw * s) / 2, (bh * s) / 2);
  }

  ctx.restore();
}

interface VisBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface PredatorCanvasProps {
  width: number;
  height: number;
  visBounds?: VisBounds;
}

export const PredatorCanvas = memo(function PredatorCanvas({ width, height, visBounds }: PredatorCanvasProps) {
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
      const predators = useGameStore.getState().predatorBugs;
      const vb = boundsRef.current;
      for (let i = 0; i < predators.length; i++) {
        const pred = predators[i];
        if (vb && (pred.x < vb.left || pred.x > vb.right || pred.y < vb.top || pred.y > vb.bottom)) continue;
        try {
          renderPredator(ctx, pred, now);
        } catch {
          ctx.restore();
        }
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
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 7, pointerEvents: 'none' }}
    />
  );
});
