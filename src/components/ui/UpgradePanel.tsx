import { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { COSTS, ALIEN, GALAXY } from '../../lib/constants';
import { formatEnergy } from '../../lib/utils';
import { getNextGalaxy } from '../../lib/galaxyData';
import { ShopModal } from './ShopModal';
import { RewardedAdButton } from './RewardedAdButton';

interface UpgradeButtonProps {
  label: string;
  icon: string;
  cost: number;
  level: number;
  energy: number;
  disabled?: boolean;
  maxLabel?: string;
  subtitle?: string;
  bonusInfo?: string;
  onClick: () => void;
}

function UpgradeButton({ label, icon, cost, level, energy, disabled, maxLabel, subtitle, bonusInfo, onClick }: UpgradeButtonProps) {
  const canAfford = energy >= cost && !disabled;

  return (
    <button
      className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-w-[68px] active:scale-95 transition-transform"
      style={{
        background: canAfford ? 'var(--color-ui-surface)' : 'rgba(30,30,63,0.5)',
        border: `1px solid ${canAfford ? 'var(--color-ui-border)' : 'rgba(58,58,110,0.3)'}`,
        opacity: canAfford ? 1 : 0.5,
        flexShrink: 0,
        scrollSnapAlign: 'center',
        touchAction: 'pan-x',
        userSelect: 'none',
      }}
      onClick={onClick}
      disabled={!canAfford}
    >
      <span className="text-lg pointer-events-none">{icon}</span>
      <span className="text-[10px] font-medium pointer-events-none" style={{ color: 'var(--color-ui-text)' }}>
        {label}
      </span>
      {subtitle && (
        <span className="text-[8px] max-w-[64px] truncate pointer-events-none" style={{ color: 'var(--color-ui-muted)' }}>
          {subtitle}
        </span>
      )}
      {bonusInfo && (
        <span className="text-[9px] font-semibold pointer-events-none" style={{ color: '#fbbf24' }}>
          {bonusInfo}
        </span>
      )}
      <span className="text-[10px] pointer-events-none" style={{ color: 'var(--color-ui-muted)' }}>
        Lv.{level}
      </span>
      <span
        className="text-[10px] font-bold pointer-events-none"
        style={{ color: disabled ? 'var(--color-ui-muted)' : 'var(--color-energy-green)' }}
      >
        {disabled ? maxLabel ?? 'MAX' : formatEnergy(cost)}
      </span>
    </button>
  );
}

export function UpgradePanel() {
  const energy = useGameStore((s) => s.energy);
  const upgrades = useGameStore((s) => s.upgrades);
  const alienCount = useGameStore((s) => s.aliens.length);
  const reproductionCost = useGameStore((s) => s.reproductionCost);
  const reproduceAlien = useGameStore((s) => s.reproduceAlien);
  const upgradeEatingCapacity = useGameStore((s) => s.upgradeEatingCapacity);
  const upgradeSpeed = useGameStore((s) => s.upgradeSpeed);
  const upgradeBugRate = useGameStore((s) => s.upgradeBugRate);
  const currentGalaxyId = useGameStore((s) => s.currentGalaxyId);
  const travelToNextGalaxy = useGameStore((s) => s.travelToNextGalaxy);
  const [expanded, setExpanded] = useState(false);
  const [showShop, setShowShop] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll-fast
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const nextGalaxy = useMemo(() => getNextGalaxy(currentGalaxyId), [currentGalaxyId]);
  const atMaxGalaxy = currentGalaxyId >= GALAXY.TOTAL_GALAXIES - 1;

  const travelEnergyBonus = useMemo(() => {
    if (atMaxGalaxy) return '';
    const nextMultiplier = Math.pow(GALAXY.ENERGY_MULTIPLIER_PER_GALAXY, currentGalaxyId + 1);
    return `⚡ ${nextMultiplier.toFixed(nextMultiplier >= 10 ? 0 : 1)}x`;
  }, [currentGalaxyId, atMaxGalaxy]);

  const costs = useMemo(
    () => ({
      reproduce: reproductionCost,
      eatingCapacity: Math.ceil(
        COSTS.EATING_CAPACITY_BASE *
          Math.pow(COSTS.EATING_CAPACITY_SCALE, upgrades.eatingCapacity - 1),
      ),
      speed: Math.ceil(
        COSTS.SPEED_BASE * Math.pow(COSTS.SPEED_SCALE, upgrades.alienSpeed),
      ),
      bugRate: Math.ceil(
        COSTS.BUG_RATE_BASE * Math.pow(COSTS.BUG_RATE_SCALE, upgrades.bugSpawnRate),
      ),
      travel: nextGalaxy?.cost ?? 0,
    }),
    [reproductionCost, upgrades, nextGalaxy],
  );

  const atMaxAliens = alienCount >= ALIEN.MAX_ALIENS;

  return (
    <>
      {/* Toggle bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <motion.button
          className="mx-auto flex items-center gap-2 px-4 py-2 rounded-t-xl"
          style={{
            background: 'var(--color-ui-surface)',
            border: '1px solid var(--color-ui-border)',
            borderBottom: 'none',
            color: 'var(--color-ui-text)',
          }}
          onClick={() => setExpanded(!expanded)}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▲
          </motion.span>
          <span className="text-sm font-medium">Upgrades</span>
        </motion.button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
              style={{
                background: 'var(--color-space-dark)',
                borderTop: '1px solid var(--color-ui-border)',
              }}
            >
              <div className="p-3 flex flex-col gap-3">
                {/* Main upgrades row - horizontally scrollable on mobile */}
                <div
                  ref={scrollRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className="flex w-full flex-nowrap gap-2 overflow-x-auto pb-1"
                  style={{
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-x',
                    scrollbarWidth: 'none',
                    overscrollBehaviorX: 'contain',
                    scrollSnapType: 'x proximity',
                    paddingLeft: 4,
                    paddingRight: 4,
                    cursor: 'grab',
                  }}
                >
                  <UpgradeButton
                    label="Reproduce"
                    icon="🥚"
                    cost={costs.reproduce}
                    level={alienCount}
                    energy={energy}
                    disabled={atMaxAliens}
                    maxLabel={`${ALIEN.MAX_ALIENS} max`}
                    onClick={reproduceAlien}
                  />
                  <UpgradeButton
                    label="Eat Power"
                    icon="🍴"
                    cost={costs.eatingCapacity}
                    level={upgrades.eatingCapacity}
                    energy={energy}
                    onClick={upgradeEatingCapacity}
                  />
                  <UpgradeButton
                    label="Speed"
                    icon="⚡"
                    cost={costs.speed}
                    level={upgrades.alienSpeed + 1}
                    energy={energy}
                    onClick={upgradeSpeed}
                  />
                  <UpgradeButton
                    label="Bug Rate"
                    icon="🐛"
                    cost={costs.bugRate}
                    level={upgrades.bugSpawnRate + 1}
                    energy={energy}
                    onClick={upgradeBugRate}
                  />
                  <UpgradeButton
                    label="Travel"
                    icon="🚀"
                    cost={costs.travel}
                    level={currentGalaxyId + 1}
                    energy={energy}
                    disabled={atMaxGalaxy}
                    maxLabel="Final"
                    subtitle={nextGalaxy?.name}
                    bonusInfo={travelEnergyBonus}
                    onClick={travelToNextGalaxy}
                  />
                </div>

                {/* Bottom actions row */}
                <div className="flex justify-center gap-3">
                  <RewardedAdButton />
                  <motion.button
                    className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white',
                    }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setShowShop(true)}
                  >
                    🛒 Shop
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showShop && <ShopModal onClose={() => setShowShop(false)} />}
      </AnimatePresence>
    </>
  );
}
