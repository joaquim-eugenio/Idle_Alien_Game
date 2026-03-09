import { useRef, useEffect, memo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { PredatorBug, PredatorSpecies } from '../../lib/types';
import { PREDATOR } from '../../lib/constants';

interface PredatorColors { body: string; head: string; limbs: string; accent: string }

const colorCache = new Map<string, PredatorColors>();

const SPECIES_BASE: Record<PredatorSpecies, { body: string; head: string; limbs: string; accent: string }> = {
  stalker:  { body: '#8B6914', head: '#6B4F10', limbs: '#5A3E0A', accent: '#D4A520' },
  ravager:  { body: '#4A3E8C', head: '#2D2566', limbs: '#1A1540', accent: '#7B6BC4' },
  lurker:   { body: '#6B2D73', head: '#4A1E50', limbs: '#2D1230', accent: '#CC3333' },
  slasher:  { body: '#A0755A', head: '#7A5540', limbs: '#5A3D2B', accent: '#D4A070' },
  devourer: { body: '#8C1A5A', head: '#661040', limbs: '#4A0A2D', accent: '#CC44AA' },
  hunter:   { body: '#4A7A30', head: '#3A6020', limbs: '#2A4A15', accent: '#88CC55' },
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

function getColors(species: PredatorSpecies, hueShift: number): PredatorColors {
  const key = `${species}:${Math.round(hueShift)}`;
  let c = colorCache.get(key);
  if (c) return c;
  const b = SPECIES_BASE[species];
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

type DrawFn = (ctx: CanvasRenderingContext2D, s: number, phase: number, c: PredatorColors) => void;

// Stalker: Brown mantis with raised claws and segmented body
const drawStalker: DrawFn = (ctx, s, phase, c) => {
  const w = 14 * s, cx = w / 2;

  // Legs
  for (let i = 0; i < 3; i++) {
    const swing = sin(phase + i * PI / 3) * 15;
    const ly = (6 + i * 2.5) * s;
    drawLimb(ctx, 1 * s, ly, 3 * s, -45 + swing, c.limbs, 1.2);
    drawLimb(ctx, w - 1 * s, ly, 3 * s, 45 - swing, c.limbs, 1.2);
  }

  // Body segments
  ctx.fillStyle = rg(ctx, cx, 10 * s, 4 * s, c.body, c.head);
  ell(ctx, cx, 10 * s, 3 * s, 4 * s);
  ctx.fillStyle = rg(ctx, cx, 6 * s, 2.5 * s, c.body, c.head);
  ell(ctx, cx, 6 * s, 2.5 * s, 2 * s);

  // Head
  ctx.fillStyle = rg(ctx, cx, 2.5 * s, 2.5 * s, c.head, c.limbs);
  ell(ctx, cx, 2.5 * s, 2.5 * s, 2 * s);

  // Raised claw arms
  const clawSwing = sin(phase * 1.5) * 10;
  drawLimb(ctx, cx - 2 * s, 4 * s, 4 * s, -70 + clawSwing, c.accent, 1.5);
  drawClaw(ctx, cx - 2 * s + cos((-70 + clawSwing) * DEG) * 0.1, 4 * s + sin((-70 + clawSwing) * DEG) * (-4 * s), 2.5 * s, -70 + clawSwing, c.accent);
  drawLimb(ctx, cx + 2 * s, 4 * s, 4 * s, 70 - clawSwing, c.accent, 1.5);
  drawClaw(ctx, cx + 2 * s + cos((70 - clawSwing) * DEG) * 0.1, 4 * s + sin((70 - clawSwing) * DEG) * (-4 * s), 2.5 * s, 70 - clawSwing, c.accent);

  // Antennae
  const aSwing = sin(phase * 2) * 5;
  drawLimb(ctx, cx - 1 * s, 1 * s, 3 * s, -160 + aSwing, c.limbs, 0.7);
  drawLimb(ctx, cx + 1 * s, 1 * s, 3 * s, 160 - aSwing, c.limbs, 0.7);

  // Eyes
  ctx.fillStyle = '#CC0000';
  circ(ctx, cx - 1 * s, 2 * s, 0.8 * s);
  circ(ctx, cx + 1 * s, 2 * s, 0.8 * s);
  ctx.fillStyle = '#FFD700';
  circ(ctx, cx - 1 * s, 1.9 * s, 0.35 * s);
  circ(ctx, cx + 1 * s, 1.9 * s, 0.35 * s);
};

// Ravager: Blue-purple armored body with large pincers/horns
const drawRavager: DrawFn = (ctx, s, phase, c) => {
  const w = 16 * s, cx = w / 2;

  // Legs
  for (let i = 0; i < 3; i++) {
    const swing = sin(phase + i * PI / 3) * 12;
    const ly = (7 + i * 2) * s;
    drawLimb(ctx, 1.5 * s, ly, 3.5 * s, -50 + swing, c.limbs, 1.5);
    drawLimb(ctx, w - 1.5 * s, ly, 3.5 * s, 50 - swing, c.limbs, 1.5);
  }

  // Armored shell
  ctx.fillStyle = rg(ctx, cx, 8.5 * s, 5 * s, c.body, c.head);
  ell(ctx, cx, 8.5 * s, 5 * s, 5 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ell(ctx, cx - 1.5 * s, 7 * s, 1.5 * s, 1.2 * s);

  // Armor plates
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - 3 * s, 7 * s);
  ctx.lineTo(cx + 3 * s, 7 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 2.5 * s, 9.5 * s);
  ctx.lineTo(cx + 2.5 * s, 9.5 * s);
  ctx.stroke();

  // Head
  ctx.fillStyle = rg(ctx, cx, 3.5 * s, 3 * s, c.head, c.limbs);
  ell(ctx, cx, 3.5 * s, 3.5 * s, 2.5 * s);

  // Horns
  const hornSwing = sin(phase * 0.8) * 3;
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.moveTo(cx - 2 * s, 2.5 * s);
  ctx.lineTo(cx - 3.5 * s, -1 * s + hornSwing * 0.1);
  ctx.lineTo(cx - 1.5 * s, 1.5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 2 * s, 2.5 * s);
  ctx.lineTo(cx + 3.5 * s, -1 * s - hornSwing * 0.1);
  ctx.lineTo(cx + 1.5 * s, 1.5 * s);
  ctx.closePath();
  ctx.fill();

  // Large pincers
  const pSwing = sin(phase * 1.2) * 8;
  drawLimb(ctx, cx - 3 * s, 5 * s, 5 * s, -80 + pSwing, c.accent, 2);
  drawClaw(ctx, cx - 3 * s - sin((80 - pSwing) * DEG) * 5 * s, 5 * s - cos((80 - pSwing) * DEG) * 5 * s, 3.5 * s, -60 + pSwing, c.accent);
  drawLimb(ctx, cx + 3 * s, 5 * s, 5 * s, 80 - pSwing, c.accent, 2);
  drawClaw(ctx, cx + 3 * s + sin((80 - pSwing) * DEG) * 5 * s, 5 * s - cos((80 - pSwing) * DEG) * 5 * s, 3.5 * s, 60 - pSwing, c.accent);

  // Eyes
  ctx.fillStyle = '#6622CC';
  circ(ctx, cx - 1.2 * s, 3 * s, 1 * s);
  circ(ctx, cx + 1.2 * s, 3 * s, 1 * s);
  ctx.fillStyle = '#EEDDFF';
  circ(ctx, cx - 1.2 * s, 2.85 * s, 0.4 * s);
  circ(ctx, cx + 1.2 * s, 2.85 * s, 0.4 * s);
};

// Lurker: Purple-red spider with 8 legs, skull-like marking
const drawLurker: DrawFn = (ctx, s, phase, c) => {
  const w = 16 * s, cx = w / 2;

  // 8 spider legs
  for (let i = 0; i < 4; i++) {
    const swing = sin(phase + i * PI / 4) * 18;
    const ly = (4 + i * 2) * s;
    const len = (3.5 + (i < 2 ? 1 : 0)) * s;
    drawLimb(ctx, 1 * s, ly, len, -55 + swing + i * 5, c.limbs, 1);
    drawLimb(ctx, w - 1 * s, ly, len, 55 - swing - i * 5, c.limbs, 1);
  }

  // Abdomen
  ctx.fillStyle = rg(ctx, cx, 9 * s, 4 * s, c.body, c.head);
  ell(ctx, cx, 9 * s, 4 * s, 3.5 * s);

  // Red stripes on abdomen
  ctx.fillStyle = c.accent;
  for (let i = 0; i < 3; i++) {
    const sy = (7.5 + i * 1.2) * s;
    ell(ctx, cx, sy, 2.5 * s, 0.3 * s);
  }

  // Cephalothorax
  ctx.fillStyle = rg(ctx, cx, 4.5 * s, 3 * s, c.body, c.head);
  ell(ctx, cx, 4.5 * s, 3 * s, 2.5 * s);

  // Skull marking
  ctx.fillStyle = c.accent;
  ell(ctx, cx, 4.5 * s, 1.5 * s, 1.2 * s);
  ctx.fillStyle = c.head;
  circ(ctx, cx - 0.5 * s, 4.2 * s, 0.3 * s);
  circ(ctx, cx + 0.5 * s, 4.2 * s, 0.3 * s);

  // Eyes (8 spider eyes in two rows)
  ctx.fillStyle = '#FF2222';
  circ(ctx, cx - 1 * s, 3.3 * s, 0.6 * s);
  circ(ctx, cx + 1 * s, 3.3 * s, 0.6 * s);
  circ(ctx, cx - 0.4 * s, 3 * s, 0.45 * s);
  circ(ctx, cx + 0.4 * s, 3 * s, 0.45 * s);
  ctx.fillStyle = '#111';
  circ(ctx, cx - 1 * s, 3.3 * s, 0.25 * s);
  circ(ctx, cx + 1 * s, 3.3 * s, 0.25 * s);
};

// Slasher: Tan/brown with long blade-like claws, spindly limbs
const drawSlasher: DrawFn = (ctx, s, phase, c) => {
  const w = 14 * s, cx = w / 2;

  // Spindly legs
  for (let i = 0; i < 4; i++) {
    const swing = sin(phase + i * PI / 4) * 20;
    const ly = (5 + i * 2) * s;
    drawLimb(ctx, 2 * s, ly, 4.5 * s, -60 + swing, c.limbs, 0.8);
    drawLimb(ctx, w - 2 * s, ly, 4.5 * s, 60 - swing, c.limbs, 0.8);
  }

  // Narrow body
  ctx.fillStyle = rg(ctx, cx, 7 * s, 3 * s, c.body, c.head);
  ell(ctx, cx, 7 * s, 2 * s, 4.5 * s);

  // Head
  ctx.fillStyle = rg(ctx, cx, 2 * s, 2 * s, c.head, c.limbs);
  ell(ctx, cx, 2 * s, 2 * s, 1.8 * s);

  // Long blade claws
  const clawSwing = sin(phase * 1.8) * 12;
  ctx.save();
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // Left blade
  ctx.translate(cx - 2 * s, 3.5 * s);
  ctx.rotate((-80 + clawSwing) * DEG);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -6 * s);
  ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.moveTo(-0.5 * s, -6 * s);
  ctx.lineTo(0, -7.5 * s);
  ctx.lineTo(0.5 * s, -6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // Right blade
  ctx.translate(cx + 2 * s, 3.5 * s);
  ctx.rotate((80 - clawSwing) * DEG);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -6 * s);
  ctx.stroke();
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.moveTo(-0.5 * s, -6 * s);
  ctx.lineTo(0, -7.5 * s);
  ctx.lineTo(0.5 * s, -6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Eyes
  ctx.fillStyle = '#222';
  circ(ctx, cx - 0.7 * s, 1.5 * s, 0.7 * s);
  circ(ctx, cx + 0.7 * s, 1.5 * s, 0.7 * s);
  ctx.fillStyle = '#FFCC00';
  circ(ctx, cx - 0.7 * s, 1.4 * s, 0.3 * s);
  circ(ctx, cx + 0.7 * s, 1.4 * s, 0.3 * s);
};

// Devourer: Magenta with single large eye-mouth, crab claws
const drawDevourer: DrawFn = (ctx, s, phase, c) => {
  const w = 14 * s, cx = w / 2;

  // Thick legs
  for (let i = 0; i < 2; i++) {
    const swing = sin(phase + i * PI) * 15;
    const ly = (8 + i * 2.5) * s;
    drawLimb(ctx, 2 * s, ly, 4 * s, -50 + swing, c.limbs, 2);
    drawLimb(ctx, w - 2 * s, ly, 4 * s, 50 - swing, c.limbs, 2);
  }

  // Bulky body
  ctx.fillStyle = rg(ctx, cx, 7 * s, 5 * s, c.body, c.head);
  ell(ctx, cx, 7 * s, 4.5 * s, 5 * s);

  // Giant eye-mouth in center
  ctx.fillStyle = '#FFEECC';
  circ(ctx, cx, 6 * s, 2.5 * s);
  ctx.fillStyle = c.accent;
  circ(ctx, cx, 6 * s, 1.8 * s);
  ctx.fillStyle = '#220011';
  circ(ctx, cx, 6 * s, 1.2 * s);
  // Pupil pulse
  const pupilSize = 0.6 + sin(phase * 2) * 0.15;
  ctx.fillStyle = '#FF0066';
  circ(ctx, cx, 6 * s, pupilSize * s);

  // Teeth ring around mouth
  ctx.fillStyle = '#FFFFDD';
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * PI * 2 + phase * 0.3;
    const tx = cx + cos(ang) * 2 * s;
    const ty = 6 * s + sin(ang) * 2 * s;
    circ(ctx, tx, ty, 0.3 * s);
  }

  // Crab claws
  const cSwing = sin(phase * 1.5) * 10;
  drawLimb(ctx, cx - 3 * s, 4.5 * s, 4 * s, -75 + cSwing, c.accent, 2.5);
  drawClaw(ctx, cx - 3 * s - sin((75 - cSwing) * DEG) * 4 * s, 4.5 * s - cos((75 - cSwing) * DEG) * 4 * s, 3 * s, -50 + cSwing, c.accent);
  drawLimb(ctx, cx + 3 * s, 4.5 * s, 4 * s, 75 - cSwing, c.accent, 2.5);
  drawClaw(ctx, cx + 3 * s + sin((75 - cSwing) * DEG) * 4 * s, 4.5 * s - cos((75 - cSwing) * DEG) * 4 * s, 3 * s, 50 - cSwing, c.accent);
};

// Hunter: Green with translucent wings, mantis head, tentacle arms
const drawHunter: DrawFn = (ctx, s, phase, c) => {
  const w = 14 * s, cx = w / 2;

  // Legs
  for (let i = 0; i < 3; i++) {
    const swing = sin(phase + i * PI / 3) * 14;
    const ly = (6.5 + i * 2) * s;
    drawLimb(ctx, 1.5 * s, ly, 3 * s, -45 + swing, c.limbs, 1);
    drawLimb(ctx, w - 1.5 * s, ly, 3 * s, 45 - swing, c.limbs, 1);
  }

  // Wings (translucent)
  ctx.globalAlpha = 0.2 + sin(phase * 4) * 0.05;
  ctx.fillStyle = c.accent;
  ctx.save();
  ctx.translate(cx - 2 * s, 5 * s);
  ctx.rotate(-15 * DEG);
  ell(ctx, 0, 0, 4 * s, 2 * s);
  ctx.restore();
  ctx.save();
  ctx.translate(cx + 2 * s, 5 * s);
  ctx.rotate(15 * DEG);
  ell(ctx, 0, 0, 4 * s, 2 * s);
  ctx.restore();
  ctx.globalAlpha = 1;

  // Abdomen
  ctx.fillStyle = rg(ctx, cx, 9 * s, 3 * s, c.body, c.head);
  ell(ctx, cx, 9 * s, 2.5 * s, 3.5 * s);

  // Thorax
  ctx.fillStyle = rg(ctx, cx, 5.5 * s, 2.5 * s, c.body, c.head);
  ell(ctx, cx, 5.5 * s, 2 * s, 2 * s);

  // Head (triangular mantis head)
  ctx.fillStyle = rg(ctx, cx, 2.5 * s, 2 * s, c.head, c.limbs);
  ctx.beginPath();
  ctx.moveTo(cx, 0.5 * s);
  ctx.lineTo(cx - 2 * s, 3.5 * s);
  ctx.lineTo(cx + 2 * s, 3.5 * s);
  ctx.closePath();
  ctx.fill();

  // Tentacle arms
  const tSwing = sin(phase * 2) * 12;
  for (let side = -1; side <= 1; side += 2) {
    ctx.save();
    ctx.translate(cx + side * 2 * s, 4.5 * s);
    ctx.rotate((side * (60 - tSwing)) * DEG);
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const cp1x = side * 1 * s;
    const cp1y = -2 * s;
    const cp2x = side * 0.5 * s;
    const cp2y = -4 * s;
    const ex = side * -0.5 * s;
    const ey = -5 * s;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
    ctx.stroke();
    ctx.restore();
  }

  // Large compound eyes
  ctx.fillStyle = '#00CC44';
  circ(ctx, cx - 1.2 * s, 2 * s, 0.9 * s);
  circ(ctx, cx + 1.2 * s, 2 * s, 0.9 * s);
  ctx.fillStyle = '#003311';
  circ(ctx, cx - 1.2 * s, 2 * s, 0.4 * s);
  circ(ctx, cx + 1.2 * s, 2 * s, 0.4 * s);
};

const DRAW_FNS: Record<PredatorSpecies, DrawFn> = {
  stalker: drawStalker,
  ravager: drawRavager,
  lurker: drawLurker,
  slasher: drawSlasher,
  devourer: drawDevourer,
  hunter: drawHunter,
};

const DIMS: Record<PredatorSpecies, [number, number]> = {
  stalker:  [28, 28],
  ravager:  [32, 28],
  lurker:   [32, 26],
  slasher:  [28, 24],
  devourer: [28, 24],
  hunter:   [28, 26],
};

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
  const c = getColors(pred.species, pred.hueShift);
  const s = pred.sizeScale * 0.85;
  const [bw, bh] = DIMS[pred.species];
  const rotation = pred.angle + PI / 2;

  const age = now - pred.spawnedAt;
  let sc = 1, alpha = 1;
  if (age < SPAWN_MS) {
    const t = age / SPAWN_MS;
    sc = 1 - pow(1 - t, 3);
    alpha = min(1, t * 2);
  }

  // Death shrink animation
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

  // HP bar (drawn above, before rotation so it stays horizontal)
  if (pred.hp > 0) {
    const barWidth = bw * s * 0.7;
    drawHpBar(ctx, 0, -(bh * s) / 2 - 4, pred.hp, pred.maxHp, barWidth);
  }

  ctx.rotate(rotation);
  ctx.scale(sc, sc);
  ctx.translate(-(bw * s) / 2, -(bh * s) / 2);

  // Damage flash or menacing aura glow
  const timeSinceDamage = now - pred.lastDamageTime;
  if (timeSinceDamage < PREDATOR.DAMAGE_FLASH_MS && pred.hp > 0) {
    ctx.shadowColor = 'rgba(255,0,0,0.8)';
    ctx.shadowBlur = 8;
  } else {
    ctx.shadowColor = 'rgba(255,0,0,0.15)';
    ctx.shadowBlur = 4;
  }

  DRAW_FNS[pred.species](ctx, s, pred.walkPhase, c);

  ctx.shadowBlur = 0;

  // Damage flash overlay
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
