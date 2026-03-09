import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Alien, SicknessLevel } from '../../lib/types';
import { ALIEN, SICKNESS } from '../../lib/constants';
import { getAlienVisuals } from '../../lib/alienVisualCache';

interface AlienEntityProps {
  alien: Alien;
  isBirthing?: boolean;
}

const SIZE = ALIEN.SIZE;
const BODY_SCALE = 1.15;

function Body({ alien }: { alien: Alien }) {
  const { traits } = alien;
  const v = getAlienVisuals(traits);

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

function Eyes({ alien, growthProgress = 1 }: { alien: Alien; growthProgress?: number }) {
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

    if (clampedCount === 1) {
      pos.push({ x: cx, y: cy });
    } else if (clampedCount === 2) {
      const spread = 20;
      pos.push({ x: cx - spread, y: cy }, { x: cx + spread, y: cy });
    } else {
      pos.push({ x: cx - 22, y: cy + 2 }, { x: cx, y: cy - 4 }, { x: cx + 22, y: cy + 2 });
    }
    return pos;
  }, [count, placement]);

  const pupilSize = Math.max(1.5, eyeR * 0.55);
  const highlightSize = Math.max(0.8, eyeR * 0.22);

  return (
    <>
      {positions.map((pos, i) => {
        const scaledEyeR = eyeR;
        return (
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
                width: scaledEyeR * 2,
                height: scaledEyeR * 2,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 45% 40%, #fff, #e8e8f0)',
                boxShadow: '0 0.5px 2px rgba(0,0,0,0.35), inset 0 -0.5px 1px rgba(0,0,0,0.1)',
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
        );
      })}
    </>
  );
}

function Arms({ alien }: { alien: Alien }) {
  const { traits } = alien;
  if (traits.armStyle === 'none') return null;

  const armCount = Math.min(Math.floor(traits.limbCount / 2), 3);
  const isEating = alien.eatingProgress > 0;
  const v = getAlienVisuals(traits);
  const phase = alien.walkPhase;

  const arms = useMemo(() => {
    const items: { y: number; angleL: number; angleR: number; len: number }[] = [];
    for (let i = 0; i < armCount; i++) {
      const yPct = 25 + i * 16;
      items.push({
        y: yPct,
        angleL: -(30 + i * 12),
        angleR: 30 + i * 12,
        len: traits.armStyle === 'stubby' ? 4 : traits.armStyle === 'tentacle' ? 8 : 6,
      });
    }
    return items;
  }, [armCount, traits.armStyle]);

  const armWidth = traits.armStyle === 'tentacle' ? 1.5 : traits.armStyle === 'stubby' ? 3 : 2;
  const armRadius = traits.armStyle === 'tentacle' ? '50%' : '2px 2px 50% 50%';

  return (
    <>
      {arms.map((arm, i) => {
        // Counter-swing: left arm opposes right leg
        const leftSwing = Math.sin(phase + Math.PI + i * 0.5) * 12;
        const rightSwing = Math.sin(phase + i * 0.5) * 12;

        const leftRot = isEating ? arm.angleL : arm.angleL + leftSwing;
        const rightRot = isEating ? arm.angleR : arm.angleR + rightSwing;

        return (
          <div key={i}>
            {/* Left arm */}
            <motion.div
              animate={
                isEating
                  ? { rotate: [arm.angleL, arm.angleL + 20, arm.angleL - 8, arm.angleL] }
                  : {}
              }
              transition={{ duration: 0.4, repeat: isEating ? Infinity : 0 }}
              style={{
                position: 'absolute',
                left: -1,
                top: `${arm.y}%`,
                width: armWidth,
                height: arm.len,
                background: v.armGradient,
                borderRadius: armRadius,
                transformOrigin: 'top center',
                transform: isEating ? undefined : `rotate(${leftRot}deg)`,
                boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {traits.armStyle === 'claw' && (
                <>
                  <div style={{
                    position: 'absolute', bottom: -1.5, left: -1, width: 2, height: 2,
                    background: v.bodyDark10, borderRadius: '0 0 50% 50%', transform: 'rotate(-20deg)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -1.5, right: -1, width: 2, height: 2,
                    background: v.bodyDark10, borderRadius: '0 0 50% 50%', transform: 'rotate(20deg)',
                  }} />
                </>
              )}
              {traits.armStyle === 'stubby' && (
                <div className="rounded-full" style={{
                  position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 3.5, height: 3, background: v.armHandStubby,
                }} />
              )}
              {traits.armStyle === 'normal' && (
                <div className="rounded-full" style={{
                  position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 2.5, background: v.armHandNormal,
                }} />
              )}
            </motion.div>
            {/* Right arm */}
            <motion.div
              animate={
                isEating
                  ? { rotate: [arm.angleR, arm.angleR - 20, arm.angleR + 8, arm.angleR] }
                  : {}
              }
              transition={{ duration: 0.4, repeat: isEating ? Infinity : 0 }}
              style={{
                position: 'absolute',
                right: -1,
                top: `${arm.y}%`,
                width: armWidth,
                height: arm.len,
                background: v.armGradient,
                borderRadius: armRadius,
                transformOrigin: 'top center',
                transform: isEating ? undefined : `rotate(${rightRot}deg)`,
                boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2)',
              }}
            >
              {traits.armStyle === 'claw' && (
                <>
                  <div style={{
                    position: 'absolute', bottom: -1.5, left: -1, width: 2, height: 2,
                    background: v.bodyDark10, borderRadius: '0 0 50% 50%', transform: 'rotate(-20deg)',
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -1.5, right: -1, width: 2, height: 2,
                    background: v.bodyDark10, borderRadius: '0 0 50% 50%', transform: 'rotate(20deg)',
                  }} />
                </>
              )}
              {traits.armStyle === 'stubby' && (
                <div className="rounded-full" style={{
                  position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 3.5, height: 3, background: v.armHandStubby,
                }} />
              )}
              {traits.armStyle === 'normal' && (
                <div className="rounded-full" style={{
                  position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 2.5, background: v.armHandNormal,
                }} />
              )}
            </motion.div>
          </div>
        );
      })}
    </>
  );
}

function Legs({ alien }: { alien: Alien }) {
  const { traits } = alien;
  if (traits.bodyShape === 'slug') return <SlugBase alien={alien} />;

  const hasOddLeg = traits.limbCount % 2 === 1;
  const v = getAlienVisuals(traits);
  const isEating = alien.eatingProgress > 0;
  const phase = alien.walkPhase;

  const leftSwing = isEating ? 0 : Math.sin(phase) * 14;
  const rightSwing = isEating ? 0 : Math.sin(phase + Math.PI) * 14;

  return (
    <>
      {/* Left leg */}
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
          transform: `rotate(${-8 + leftSwing}deg)`,
          boxShadow: 'inset 0 -1px 1.5px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          position: 'absolute', bottom: -1, left: -0.5, width: 3.5, height: 1.5,
          background: v.bodyDark12, borderRadius: '1px 1px 50% 50%',
        }} />
      </div>
      {/* Right leg */}
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
          transform: `rotate(${8 + rightSwing}deg)`,
          boxShadow: 'inset 0 -1px 1.5px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          position: 'absolute', bottom: -1, left: -0.5, width: 3.5, height: 1.5,
          background: v.bodyDark12, borderRadius: '1px 1px 50% 50%',
        }} />
      </div>
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
            boxShadow: 'inset 0 -1px 1.5px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{
            position: 'absolute', bottom: -1, left: -0.75, width: 3.5, height: 1.5,
            background: v.bodyDark12, borderRadius: '1px 1px 50% 50%',
          }} />
        </div>
      )}
    </>
  );
}

function SlugBase({ alien }: { alien: Alien }) {
  const v = getAlienVisuals(alien.traits);
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
        boxShadow: `0 1px 3px rgba(0,0,0,0.3)`,
      }}
    />
  );
}

function Horns({ alien }: { alien: Alien }) {
  const { traits } = alien;
  if (traits.hornType === 'none') return null;

  const v = getAlienVisuals(traits);
  const color = v.hornColor;
  const tip = v.hornTip;

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
          filter: `drop-shadow(0 0 2px ${tip}66)`,
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
    case 'antlers':
      return (
        <>
          <div style={{
            position: 'absolute', left: '25%', top: -5,
            width: 1, height: 6, background: color, borderRadius: 1,
            transform: 'rotate(-15deg)', transformOrigin: 'bottom center',
          }}>
            <div style={{
              position: 'absolute', top: 1, left: -2, width: 3, height: 1,
              background: color, borderRadius: 1, transform: 'rotate(-30deg)',
            }} />
          </div>
          <div style={{
            position: 'absolute', right: '25%', top: -5,
            width: 1, height: 6, background: color, borderRadius: 1,
            transform: 'rotate(15deg)', transformOrigin: 'bottom center',
          }}>
            <div style={{
              position: 'absolute', top: 1, right: -2, width: 3, height: 1,
              background: color, borderRadius: 1, transform: 'rotate(30deg)',
            }} />
          </div>
        </>
      );
    case 'spikes':
      return (
        <>
          {[30, 42, 55, 68].map((left, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${left}%`, top: -3 - (i % 2) * 2,
              width: 0, height: 0,
              borderLeft: '1px solid transparent',
              borderRight: '1px solid transparent',
              borderBottom: `${3 + (i % 2)}px solid ${color}`,
            }} />
          ))}
        </>
      );
    default:
      return null;
  }
}

function Antennae({ alien }: { alien: Alien }) {
  const { traits } = alien;
  if (traits.antennae === 0 || traits.eyePlacement === 'stalks') return null;
  const v = getAlienVisuals(traits);

  const antennae = useMemo(() => {
    const items: { x: number; rotation: number }[] = [];
    if (traits.antennae === 1) {
      items.push({ x: 50, rotation: 0 });
    } else if (traits.antennae === 2) {
      items.push({ x: 35, rotation: -18 }, { x: 65, rotation: 18 });
    } else {
      items.push({ x: 25, rotation: -28 }, { x: 50, rotation: 0 }, { x: 75, rotation: 28 });
    }
    return items;
  }, [traits.antennae]);

  return (
    <>
      {antennae.map((a, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${a.x}%`,
            top: -1,
            transform: `translateX(-50%) rotate(${a.rotation}deg)`,
            transformOrigin: 'bottom center',
            animation: `sway 2.5s ease-in-out ${i * 0.4}s infinite`,
          }}
        >
          <div style={{
            width: 0.8, height: 6,
            background: v.antennaeGradient,
            margin: '0 auto', borderRadius: 1,
          }} />
          <div className="rounded-full" style={{
            width: 2.5, height: 2.5,
            background: v.antennaeBallGradient,
            margin: '-1px auto 0', transform: 'translateY(-100%)',
            boxShadow: `0 0 3px ${traits.bodyColor}88`,
          }} />
        </div>
      ))}
    </>
  );
}

function AngryMouth({ alien }: { alien: Alien }) {
  const { traits } = alien;
  const mouthW = SIZE * 0.52;
  const mouthH = SIZE * 0.3;

  const teethCount = traits.mouthStyle === 'fangs' ? 2
    : (traits.mouthStyle === 'teeth' || traits.hasTeeth) ? Math.min(5, Math.max(3, Math.round(mouthW / 2)))
    : 4;

  return (
    <div
      style={{
        position: 'absolute', left: '50%', top: '56%',
        width: mouthW, height: mouthH,
        animation: 'angry-shake 0.08s linear infinite',
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Upper lip - snarling angular shape */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '35%',
          background: '#1a0a15',
          borderRadius: '2px 2px 0 0',
          clipPath: 'polygon(0% 0%, 15% 100%, 30% 40%, 50% 100%, 70% 40%, 85% 100%, 100% 0%)',
        }} />
        {/* Mouth interior */}
        <div style={{
          position: 'absolute', top: '20%', left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at 50% 20%, #3a0820, #0a0a15)',
          border: '0.8px solid rgba(0,0,0,0.5)',
          borderRadius: '15% 15% 45% 45%',
        }}>
          {/* Teeth row - pointed like the reference image */}
          <div style={{
            position: 'absolute', top: 0, left: '5%', width: '90%',
            display: 'flex', justifyContent: 'space-evenly',
          }}>
            {Array.from({ length: teethCount }).map((_, i) => {
              const isFang = traits.mouthStyle === 'fangs';
              const h = isFang ? 3.5 : 1.5 + Math.random() * 0.8;
              const w = isFang ? 1.8 : 1.3;
              return (
                <div key={i} style={{
                  width: w, height: h,
                  background: '#f0f0f0',
                  borderRadius: '0 0 30% 30%',
                  boxShadow: 'inset 0 -0.5px 0.5px rgba(0,0,0,0.15)',
                }} />
              );
            })}
          </div>
          {/* Lower teeth (smaller) */}
          <div style={{
            position: 'absolute', bottom: 0, left: '10%', width: '80%',
            display: 'flex', justifyContent: 'space-evenly',
          }}>
            {Array.from({ length: Math.max(2, teethCount - 1) }).map((_, i) => (
              <div key={i} style={{
                width: 1.0, height: 1.0,
                background: '#e8e8e8',
                borderRadius: '30% 30% 0 0',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mouth({ alien, growthProgress = 1 }: { alien: Alien; growthProgress?: number }) {
  const { traits } = alien;
  const isEating = alien.eatingProgress > 0;
  const isBaby = growthProgress < 1;
  const isAngry = alien.angryUntil > Date.now();
  const style = isBaby ? 'smile' : traits.mouthStyle;

  if (isAngry && !isBaby) {
    return <AngryMouth alien={alien} />;
  }

  if (style === 'dot') {
    return (
      <motion.div
        style={{
          position: 'absolute', left: '50%', top: '62%',
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, #1a1a2e 60%, #0a0a15)',
          border: '0.8px solid rgba(0,0,0,0.35)',
        }}
        animate={{
          width: isEating ? 5 : 2.5,
          height: isEating ? 4 : 1.5,
          borderRadius: isEating ? '30% 30% 50% 50%' : '50%',
        }}
        transition={{ duration: 0.12 }}
      />
    );
  }

  if (style === 'smile') {
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

  // open / teeth / fangs
  const mouthW = isEating ? SIZE * 0.4 : SIZE * 0.3;
  const mouthH = isEating ? SIZE * 0.25 : SIZE * 0.18;

  return (
    <motion.div
      style={{
        position: 'absolute', left: '50%', top: '58%',
        transform: 'translateX(-50%)',
        overflow: 'hidden',
      }}
      animate={{
        width: mouthW, height: mouthH,
        borderRadius: style === 'fangs' ? '20% 20% 50% 50%' : '30% 30% 50% 50%',
      }}
      transition={{ duration: 0.12 }}
    >
      <div style={{
        width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at 50% 30%, #2a1020, #0a0a15)',
        border: '0.8px solid rgba(0,0,0,0.4)',
        borderRadius: 'inherit',
        position: 'relative',
      }}>
        {(style === 'teeth' || (style === 'open' && traits.hasTeeth)) && (
          <div style={{
            position: 'absolute', top: 0, left: '10%', width: '80%',
            display: 'flex', justifyContent: 'center', gap: 0.5,
          }}>
            {Array.from({ length: Math.min(5, Math.round(mouthW / 2)) }).map((_, i) => (
              <div key={i} style={{
                width: 1.2, height: 1.5,
                background: '#f0f0f0', borderRadius: '0 0 40% 40%',
              }} />
            ))}
          </div>
        )}
        {style === 'fangs' && (
          <>
            <div style={{
              position: 'absolute', top: 0, left: '15%',
              width: 1.5, height: 2.5,
              background: '#f0f0f0', borderRadius: '0 0 50% 50%',
            }} />
            <div style={{
              position: 'absolute', top: 0, right: '15%',
              width: 1.5, height: 2.5,
              background: '#f0f0f0', borderRadius: '0 0 50% 50%',
            }} />
          </>
        )}
        {/* Tongue hint */}
        {isEating && (
          <div style={{
            position: 'absolute', bottom: 0, left: '35%',
            width: '30%', height: '40%',
            background: '#c44060', borderRadius: '50% 50% 0 0',
            opacity: 0.7,
          }} />
        )}
      </div>
    </motion.div>
  );
}

function seededRandom(seed: number): () => number {
  let s = Math.abs(seed) || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return h;
}

const BUBBLE_CONFIG: Record<SicknessLevel, { count: number; minSize: number; maxSize: number; opacity: number }> = {
  none: { count: 0, minSize: 0, maxSize: 0, opacity: 0 },
  light: { count: 4, minSize: 2, maxSize: 3, opacity: 0.35 },
  mid: { count: 8, minSize: 3, maxSize: 5, opacity: 0.5 },
  heavy: { count: 14, minSize: 4, maxSize: 7, opacity: 0.7 },
};

function SicknessBubbles({ alien }: { alien: Alien }) {
  const level = alien.sicknessLevel;
  const config = BUBBLE_CONFIG[level];

  const bubbles = useMemo(() => {
    if (config.count === 0) return [];
    const rng = seededRandom(hashId(alien.id));
    return Array.from({ length: config.count }, (_, i) => ({
      x: 15 + rng() * 70,
      y: 15 + rng() * 65,
      size: config.minSize + rng() * (config.maxSize - config.minSize),
      delay: rng() * 2,
    }));
  }, [alien.id, config.count, config.minSize, config.maxSize]);

  if (level === 'none') return null;

  return (
    <>
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, rgba(140, 255, 120, 0.9), rgba(80, 180, 60, 0.6))`,
            boxShadow: `0 0 ${b.size * 0.5}px rgba(100, 200, 80, 0.4)`,
            animation: `sickness-bubble ${1.5 + b.delay * 0.5}s ease-in-out ${b.delay}s infinite`,
            '--bubble-opacity': config.opacity,
            pointerEvents: 'none' as const,
            zIndex: 5,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

function SicknessOverlay({ level }: { level: SicknessLevel }) {
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

const DISSOLVE_PARTICLE_COUNT = 12;

function DissolveParticles({ alien, progress }: { alien: Alien; progress: number }) {
  const particles = useMemo(() => {
    const rng = seededRandom(hashId(alien.id) + 99);
    return Array.from({ length: DISSOLVE_PARTICLE_COUNT }, () => {
      const angle = rng() * Math.PI * 2;
      const dist = 15 + rng() * 25;
      return {
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist,
        size: 2 + rng() * 4,
        delay: rng() * 0.4,
      };
    });
  }, [alien.id]);

  if (progress <= 0.1) return null;

  return (
    <>
      {particles.map((p, i) => {
        const particleProgress = Math.max(0, Math.min(1, (progress - p.delay) / (1 - p.delay)));
        const ease = 1 - Math.pow(1 - particleProgress, 2);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: alien.traits.bodyColor,
              transform: `translate(${p.tx * ease}px, ${p.ty * ease}px) scale(${1 - ease})`,
              opacity: 1 - ease,
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />
        );
      })}
    </>
  );
}

const MITOSIS_DURATION = 1200;

export const AlienEntity = memo(function AlienEntity({ alien, isBirthing = false }: AlienEntityProps) {
  const isEating = alien.eatingProgress > 0;

  const growthProgress = Math.min(alien.bugsEaten / ALIEN.BUGS_TO_MATURE, 1);
  const growthScale = 0.5 + growthProgress * 0.5;
  const totalSize = SIZE * BODY_SCALE * growthScale;
  const bobY = Math.sin(alien.walkPhase * 2) * 1;

  const isBorn = alien.birthTime != null;
  const birthAge = isBorn ? Date.now() - alien.birthTime! : Infinity;
  const inMitosis = birthAge < MITOSIS_DURATION;

  const mitosisProgress = inMitosis ? Math.min(birthAge / MITOSIS_DURATION, 1) : 1;
  const easeOut = 1 - Math.pow(1 - mitosisProgress, 3);

  const mitosisScale = inMitosis ? 0.1 + easeOut * 0.9 : 1;
  const mitosisOpacity = inMitosis ? 0.3 + easeOut * 0.7 : 1;

  const pinchPhase = inMitosis ? mitosisProgress : 1;
  const stretchY = pinchPhase < 0.4
    ? 1.6 - pinchPhase * 1.5
    : pinchPhase < 0.7
      ? 1.0 + Math.sin((pinchPhase - 0.4) * Math.PI / 0.3) * 0.15
      : 1.0;
  const stretchX = pinchPhase < 0.4
    ? 0.6 + pinchPhase * 1.0
    : pinchPhase < 0.7
      ? 1.0 - Math.sin((pinchPhase - 0.4) * Math.PI / 0.3) * 0.1
      : 1.0;

  const birthingProgress = isBirthing ? Math.min((Date.now() % 1200) / 1200, 1) : 0;
  const birthingWobbleX = isBirthing
    ? 1.0 + Math.sin(birthingProgress * Math.PI * 4) * 0.08
    : 1;
  const birthingWobbleY = isBirthing
    ? 1.0 + Math.cos(birthingProgress * Math.PI * 4) * 0.08
    : 1;
  const birthingScale = isBirthing
    ? 1.0 + Math.sin(birthingProgress * Math.PI) * 0.12
    : 1;

  const finalStretchX = (inMitosis ? stretchX : 1) * birthingWobbleX;
  const finalStretchY = (inMitosis ? stretchY : 1) * birthingWobbleY;

  let eatWobble = 1;
  if (isEating) {
    const t = (Date.now() % 350) / 350;
    eatWobble = 1 + Math.sin(t * Math.PI * 2) * 0.08;
  }

  // Dissolve effect
  const isDying = alien.isDying && alien.deathTime != null;
  const dissolveProgress = isDying
    ? Math.min((Date.now() - alien.deathTime!) / SICKNESS.DISSOLVE_DURATION, 1)
    : 0;
  const dissolveEase = 1 - Math.pow(1 - dissolveProgress, 2);
  const dissolveScale = isDying ? 1 - dissolveEase * 0.4 : 1;
  const dissolveOpacity = isDying ? 1 - dissolveEase : 1;

  // Sickness color filter
  const sicknessFilter = alien.sicknessLevel === 'none'
    ? undefined
    : alien.sicknessLevel === 'light'
      ? 'saturate(0.85) hue-rotate(8deg)'
      : alien.sicknessLevel === 'mid'
        ? 'saturate(0.7) hue-rotate(18deg)'
        : 'saturate(0.5) hue-rotate(30deg) brightness(0.9)';

  const timeSinceDamage = alien.lastDamageTime ? Date.now() - alien.lastDamageTime : Infinity;
  const isTakingDamage = timeSinceDamage < 200;
  const damageFilter = isTakingDamage ? 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)' : undefined;
  
  const combinedFilter = [sicknessFilter, damageFilter].filter(Boolean).join(' ') || undefined;

  const composedScale = growthScale * mitosisScale * birthingScale * eatWobble * dissolveScale;
  const finalOpacity = Math.min(mitosisOpacity, dissolveOpacity);
  const tx = alien.x - totalSize / 2;
  const ty = alien.y - totalSize / 2 + bobY;

  return (
    <div
      className="absolute"
      style={{
        zIndex: 10,
        transform: `translate3d(${tx}px,${ty}px,0) scale(${composedScale})`,
        opacity: finalOpacity,
        transition: inMitosis
          ? 'opacity 0.4s ease'
          : 'transform 0.35s linear, opacity 0.4s ease',
        willChange: 'transform',
        contain: 'layout style',
        filter: combinedFilter,
      }}
    >
      <div
        className="relative"
        style={{
          width: totalSize,
          height: totalSize,
          transform: `scaleX(${finalStretchX}) scaleY(${finalStretchY})`,
          transition: inMitosis ? 'transform 0.15s ease-out' : 'transform 0.3s ease-out',
        }}
      >
        {inMitosis && (
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: pinchPhase < 0.5
                ? '40% 60% 55% 45% / 55% 40% 60% 45%'
                : '50%',
              background: `radial-gradient(circle, ${alien.traits.bodyColor}55 0%, transparent 70%)`,
              opacity: 1 - easeOut,
              pointerEvents: 'none',
              transition: 'border-radius 0.2s ease-out',
            }}
          />
        )}
        {isBirthing && (
          <div
            style={{
              position: 'absolute',
              inset: -3,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alien.traits.bodyColor}33 0%, transparent 60%)`,
              opacity: 0.6,
              pointerEvents: 'none',
              animation: 'pulse-glow 0.6s ease-in-out infinite',
            }}
          />
        )}
        <Horns alien={alien} />
        <Antennae alien={alien} />
        <Body alien={alien} />
        <SicknessOverlay level={alien.sicknessLevel} />
        <SicknessBubbles alien={alien} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Eyes alien={alien} growthProgress={growthProgress} />
          <Mouth alien={alien} growthProgress={growthProgress} />
        </div>
        <Arms alien={alien} />
        <Legs alien={alien} />
      </div>
      {isDying && <DissolveParticles alien={alien} progress={dissolveProgress} />}
      {alien.level > 1 && !isDying && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
          Lv {alien.level}
        </div>
      )}
      {alien.hp < alien.maxHp && !isDying && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-200"
            style={{ 
              width: `${Math.max(0, Math.min(100, (alien.hp / alien.maxHp) * 100))}%`,
              backgroundColor: alien.hp / alien.maxHp < 0.3 ? '#ef4444' : alien.hp / alien.maxHp < 0.6 ? '#eab308' : '#22c55e'
            }}
          />
        </div>
      )}
    </div>
  );
});
