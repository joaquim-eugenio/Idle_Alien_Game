import { create } from 'zustand';
import type { ShopState, ShopActions, ShopProduct } from '../lib/types';
import { ENERGY, ADS } from '../lib/constants';
import { useGameStore } from './gameStore';

const PRODUCTS: ShopProduct[] = [
  {
    id: 'energy_small',
    name: 'Energy Snack',
    description: '50 Energy',
    price: '$0.99',
    energyAmount: 50,
    type: 'energy_pack',
  },
  {
    id: 'energy_medium',
    name: 'Energy Feast',
    description: '250 Energy',
    price: '$2.99',
    energyAmount: 250,
    type: 'energy_pack',
  },
  {
    id: 'energy_large',
    name: 'Energy Overload',
    description: '1000 Energy',
    price: '$6.99',
    energyAmount: 1000,
    type: 'energy_pack',
  },
  {
    id: 'remove_ads',
    name: 'Remove Ads',
    description: 'No more interruptions!',
    price: '$3.99',
    energyAmount: 0,
    type: 'remove_ads',
  },
  {
    id: 'starter_pack',
    name: 'Starter Pack',
    description: '500 Energy + Remove Ads',
    price: '$4.99',
    energyAmount: 500,
    type: 'starter_pack',
  },
];

export const useShopStore = create<ShopState & ShopActions>((set, get) => ({
  products: PRODUCTS,
  adsRemoved: false,
  lastRewardedAdTime: 0,
  rewardedAdCooldown: ADS.REWARDED_COOLDOWN_MS,
  interstitialCounter: 0,

  purchase: (productId: string) => {
    const product = get().products.find((p) => p.id === productId);
    if (!product) return;

    // In production, this would trigger Capacitor's in-app purchase plugin
    // For dev, simulate a successful purchase
    if (product.energyAmount > 0) {
      useGameStore.getState().addEnergy(product.energyAmount);
    }
    if (product.type === 'remove_ads' || product.type === 'starter_pack') {
      set({ adsRemoved: true });
    }
  },

  watchRewardedAd: () => {
    const state = get();
    if (Date.now() - state.lastRewardedAdTime < ADS.REWARDED_COOLDOWN_MS) return false;

    useGameStore.getState().addEnergy(ENERGY.REWARDED_AD_AMOUNT);
    set({ lastRewardedAdTime: Date.now() });
    return true;
  },

  checkInterstitial: () => {
    const state = get();
    if (state.adsRemoved) return false;
    return state.interstitialCounter > 0 &&
      state.interstitialCounter % ADS.INTERSTITIAL_EVERY_N_REPRODUCTIONS === 0;
  },

  setAdsRemoved: (removed: boolean) => set({ adsRemoved: removed }),
}));
