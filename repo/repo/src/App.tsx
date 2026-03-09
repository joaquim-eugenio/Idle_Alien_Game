import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MobileFrame } from './components/layout/MobileFrame';
import { SplashScreen } from './components/layout/SplashScreen';
import { GameCanvas } from './components/game/GameCanvas';
import { HUD } from './components/ui/HUD';
import { UpgradePanel } from './components/ui/UpgradePanel';
import { AdBanner } from './components/ui/AdBanner';
import { useGameLoop } from './hooks/useGameLoop';
import { useAutoSave } from './hooks/useAutoSave';

function GameScreen() {
  useGameLoop();
  useAutoSave();

  return (
    <>
      <GameCanvas />
      <HUD />
      <UpgradePanel />
      <AdBanner />
    </>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <MobileFrame>
      <AnimatePresence mode="wait">
        {!started ? (
          <SplashScreen key="splash" onComplete={() => setStarted(true)} />
        ) : (
          <GameScreen key="game" />
        )}
      </AnimatePresence>
    </MobileFrame>
  );
}
