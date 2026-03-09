import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.idlealientycoon.app',
  appName: 'Idle Alien Tycoon',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    ScreenOrientation: {
      lockOrientation: 'portrait',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a1a',
    },
  },
};

export default config;
