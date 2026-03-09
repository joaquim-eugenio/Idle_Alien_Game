import { useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useShopStore } from '../store/shopStore';
import { ENERGY, ADS } from '../lib/constants';

export function useAdManager() {
  const addEnergy = useGameStore((s) => s.addEnergy);
  const adsRemoved = useShopStore((s) => s.adsRemoved);
  const lastRewardedAdTime = useShopStore((s) => s.lastRewardedAdTime);
  const interstitialCounter = useShopStore((s) => s.interstitialCounter);

  const canWatchRewardedAd = useCallback(() => {
    return Date.now() - lastRewardedAdTime >= ADS.REWARDED_COOLDOWN_MS;
  }, [lastRewardedAdTime]);

  const watchRewardedAd = useCallback(() => {
    if (!canWatchRewardedAd()) return false;

    // In production, this would trigger the Capacitor AdMob plugin
    // For dev, simulate an ad completion
    addEnergy(ENERGY.REWARDED_AD_AMOUNT);
    useShopStore.setState({ lastRewardedAdTime: Date.now() });
    return true;
  }, [canWatchRewardedAd, addEnergy]);

  const watchAdForAction = useCallback(() => {
    // Separate ad path for heal/clean actions: no shared cooldown, no energy reward.
    // In production, this triggers a real rewarded ad via Capacitor AdMob.
    return true;
  }, []);

  const shouldShowInterstitial = useCallback(() => {
    if (adsRemoved) return false;
    return interstitialCounter > 0 &&
      interstitialCounter % ADS.INTERSTITIAL_EVERY_N_REPRODUCTIONS === 0;
  }, [adsRemoved, interstitialCounter]);

  const showInterstitial = useCallback(() => {
    if (!shouldShowInterstitial()) return;
    // In production, trigger interstitial via Capacitor plugin
    // console.log('[AdManager] Interstitial ad triggered');
  }, [shouldShowInterstitial]);

  const rewardedCooldownRemaining = Math.max(
    0,
    ADS.REWARDED_COOLDOWN_MS - (Date.now() - lastRewardedAdTime),
  );

  return {
    canWatchRewardedAd: canWatchRewardedAd(),
    watchRewardedAd,
    watchAdForAction,
    shouldShowInterstitial: shouldShowInterstitial(),
    showInterstitial,
    adsRemoved,
    rewardedCooldownRemaining,
  };
}
