import { memo, useMemo } from 'react';
import type { Alien, SicknessLevel } from '../../lib/types';
import { ALIEN } from '../../lib/constants';
import { getAlienVisuals } from '../../lib/alienVisualCache';

const SIZE = ALIEN.SIZE;

function MiniBody({ alien }: { alien: Alien }) {
  const v = getAlienVisuals(alien.traits);
  const { traits } = alien;

  return (
    <div
      style={{
        position: 'absolute',
        width: v.bodyDims.w,
        height: v.bodyDims.h,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: v.bodyDims.radius,
        background: v.bodyBackground,
        boxShadow: v.bodyBoxShadow,
      }}
    >
      {traits.pattern === 'belly' && (
        <div
          style={{
            position: 'absolute',
            width: '50%',
            height: '35%',
            left: '25%',
            top: '50%',
            borderRadius: '50%',
            background: v.bellyGradient,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          width: '55%',
          height: '30%',
          left: '22%',
          top: '15%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(255,255,255,0.13) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

function MiniEyes({ alien, growthProgress }: { alien: Alien; growthProgress: number }) {
  const { traits } = alien;
  const count = traits.eyeCount;
  const placement = traits.eyePlacement;

  const sizeMap = { small: 2.5, medium: 3.5, large: 4.5 };
  const babyEyeScale = 1 + (1 - growthProgress) * 0.4;
  const eyeR = sizeMap[traits.eyeSize] * babyEyeScale;

  const positions = useMemo(() => {
    const pos: { x: number; y: number }[] = [];
    const cx = 50;
    const cy = placement === 'top' ? 12 : placement === 'stalks' ? 5 : 32;
    const clampedCount = Math.min(count, 3);

    if (clampedCount === 1) pos.push({ x: cx, y: cy });
    else if (clampedCount === 2) pos.push({ x: cx - 20, y: cy }, { x: cx + 20, y: cy });
    else pos.push({ x: cx - 22, y: cy + 2 }, { x: cx, y: cy - 4 }, { x: cx + 22, y: cy + 2 });
    return pos;
  }, [count, placement]);

  const pupilSize = Math.max(1.5, eyeR * 0.55);
  const highlightSize = Math.max(0.8, eyeR * 0.22);

  return (
    <>
      {positions.map((pos, i) => (
        <div key={i}>
          {placement === 'stalks' && (
            <div
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y + 8}%`,
                transform: 'translateX(-50%)',
                width: 1,
                height: SIZE * 0.35,
                background: getAlienVisuals(traits).stalkGradient,
                borderRadius: 1,
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              width: eyeR * 2,
              height: eyeR * 2,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 45% 40%, #fff, #e8e8f0)',
              boxShadow: '0 0.5px 2px rgba(0,0,0,0.35)',
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: pupilSize * 1.4,
                height: pupilSize * 1.4,
                left: '50%',
                top: '52%',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: `radial-gradient(circle, #1a1a2e 40%, ${traits.eyeColor} 100%)`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: pupilSize * 0.7,
                  height: pupilSize * 0.7,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderRadius: '50%',
                  background: '#0a0a15',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                width: highlightSize,
                height: highlightSize,
                left: '30%',
                top: '25%',
                borderRadius: '50%',
                background: '#fff',
                opacity: 0.9,
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

function MiniLegs({ alien }: { alien: Alien }) {
  const { traits } = alien;
  if (traits.bodyShape === 'slug') {
    const v = getAlienVisuals(traits);
    return (
      <div
        style={{
          position: 'absolute',
          bottom: -2,
          left: '15%',
          width: '70%',
          height: 3,
          background: v.slugBaseGradient,
          borderRadius: '0 0 50% 50%',
        }}
      />
    );
  }

  const v = getAlienVisuals(traits);
  const hasOddLeg = traits.limbCount % 2 === 1;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          bottom: -3,
          left: '25%',
          width: 2.5,
          height: 6,
          background: v.legGradient,
          borderRadius: '1.5px 1.5px 1px 1px',
          transformOrigin: 'top center',
          transform: 'rotate(-8deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -3,
          right: '25%',
          width: 2.5,
          height: 6,
          background: v.legGradient,
          borderRadius: '1.5px 1.5px 1px 1px',
          transformOrigin: 'top center',
          transform: 'rotate(8deg)',
        }}
      />
      {hasOddLeg && (
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 2,
            height: 5,
            background: v.legGradient,
            borderRadius: '1.5px 1.5px 1px 1px',
          }}
        />
      )}
    </>
  );
}

function MiniHorns({ alien }: { alien: Alien }) {
  const { traits } = alien;
  if (traits.hornType === 'none') return null;
  const v = getAlienVisuals(traits);
  const color = v.hornColor;

  switch (traits.hornType) {
    case 'single':
      return (
        <div style={{
          position: 'absolute', left: '50%', top: -4,
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '2px solid transparent',
          borderRight: '2px solid transparent',
          borderBottom: `6px solid ${color}`,
        }} />
      );
    case 'double':
      return (
        <>
          <div style={{
            position: 'absolute', left: '30%', top: -3,
            width: 0, height: 0,
            borderLeft: '1.5px solid transparent',
            borderRight: '1.5px solid transparent',
            borderBottom: `5px solid ${color}`,
            transform: 'rotate(-12deg)',
          }} />
          <div style={{
            position: 'absolute', right: '30%', top: -3,
            width: 0, height: 0,
            borderLeft: '1.5px solid transparent',
            borderRight: '1.5px solid transparent',
            borderBottom: `5px solid ${color}`,
            transform: 'rotate(12deg)',
          }} />
        </>
      );
    default:
      return null;
  }
}

function MiniMouth({ alien, growthProgress }: { alien: Alien; growthProgress: number }) {
  const { traits } = alien;
  const isBaby = growthProgress < 1;
  const style = isBaby ? 'smile' : traits.mouthStyle;

  if (style === 'dot') {
    return (
      <div
        style={{
          position: 'absolute', left: '50%', top: '62%',
          transform: 'translateX(-50%)',
          width: 2.5, height: 1.5,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, #1a1a2e 60%, #0a0a15)',
        }}
      />
    );
  }

  const smileWidth = isBaby ? SIZE * 0.42 : SIZE * 0.3;
  const smileHeight = isBaby ? SIZE * 0.18 : SIZE * 0.12;
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '60%',
      transform: 'translateX(-50%)',
      width: smileWidth, height: smileHeight,
      borderBottom: `${isBaby ? 2 : 1.5}px solid #1a1a2e`,
      borderRadius: '0 0 50% 50%',
    }} />
  );
}

function MiniSicknessOverlay({ level }: { level: SicknessLevel }) {
  if (level === 'none') return null;
  const overlayOpacity = level === 'light' ? 0.08 : level === 'mid' ? 0.15 : 0.25;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        background: `radial-gradient(circle, rgba(80, 160, 40, ${overlayOpacity}) 0%, rgba(60, 120, 30, ${overlayOpacity * 0.7}) 100%)`,
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  );
}

interface AlienMiniatureProps {
  alien: Alien;
  size?: number;
}

export const AlienMiniature = memo(function AlienMiniature({ alien, size = 48 }: AlienMiniatureProps) {
  const growthProgress = Math.min(alien.bugsEaten / ALIEN.BUGS_TO_MATURE, 1);
  const growthScale = 0.5 + growthProgress * 0.5;
  const totalSize = SIZE * 1.15 * growthScale;

  const sicknessFilter = alien.sicknessLevel === 'none'
    ? undefined
    : alien.sicknessLevel === 'light'
      ? 'saturate(0.85) hue-rotate(8deg)'
      : alien.sicknessLevel === 'mid'
        ? 'saturate(0.7) hue-rotate(18deg)'
        : 'saturate(0.5) hue-rotate(30deg) brightness(0.9)';

  const renderScale = size / (SIZE * 1.6);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: sicknessFilter,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: totalSize,
          height: totalSize,
          transform: `scale(${renderScale})`,
          transformOrigin: 'center center',
        }}
      >
        <MiniHorns alien={alien} />
        <MiniBody alien={alien} />
        <MiniSicknessOverlay level={alien.sicknessLevel} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <MiniEyes alien={alien} growthProgress={growthProgress} />
          <MiniMouth alien={alien} growthProgress={growthProgress} />
        </div>
        <MiniLegs alien={alien} />
      </div>
    </div>
  );
});
