import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdManager } from '../../hooks/useAdManager';
import { ENERGY } from '../../lib/constants';

export function RewardedAdButton() {
  const { canWatchRewardedAd, watchRewardedAd, rewardedCooldownRemaining } = useAdManager();
  const [cooldown, setCooldown] = useState(rewardedCooldownRemaining);

  useEffect(() => {
    if (rewardedCooldownRemaining <= 0) {
      setCooldown(0);
      return;
    }
    setCooldown(rewardedCooldownRemaining);
    const interval = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [rewardedCooldownRemaining]);

  const secondsLeft = Math.ceil(cooldown / 1000);

  return (
    <motion.button
      className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium active:scale-95"
      style={{
        background: canWatchRewardedAd
          ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
          : 'rgba(255,255,255,0.1)',
        color: canWatchRewardedAd ? 'white' : 'var(--color-ui-muted)',
        opacity: canWatchRewardedAd ? 1 : 0.6,
      }}
      whileTap={{ scale: 0.92 }}
      onClick={() => watchRewardedAd()}
      disabled={!canWatchRewardedAd}
    >
      🎬 {canWatchRewardedAd ? `+${ENERGY.REWARDED_AD_AMOUNT}E` : `${secondsLeft}s`}
    </motion.button>
  );
}
