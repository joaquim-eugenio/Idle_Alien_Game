# Idle Alien Tycoon

A portrait-only idle/tycoon mobile game where cute alien animals roam the screen eating bugs and plants to accumulate energy. Spend energy to reproduce aliens (with procedural mutations) and upgrade their abilities.

## Tech Stack

- **Framework:** React 19 + Vite + TypeScript
- **Styling:** Tailwind CSS 4 (mobile-first)
- **Animation:** Framer Motion
- **State Management:** Zustand
- **Mobile Deployment:** Capacitor (Android + iOS)

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in a browser (portrait mode recommended).

## Building for Production

```bash
npm run build
```

## Mobile Deployment (Capacitor)

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # Opens Android Studio
npx cap open ios        # Opens Xcode
```

## Project Structure

```
src/
  components/
    game/       -- Game entities (aliens, bugs, plants, effects)
    ui/         -- HUD, upgrade panel, shop, ads, settings
    layout/     -- Mobile frame, splash screen
  hooks/        -- Game loop, camera, auto-save, ad manager
  store/        -- Zustand stores (game state, shop)
  lib/          -- Types, constants, utilities, alien generator
```

## Game Mechanics

- **Aliens** eat bugs and plants to gain energy
- **Energy** is spent on reproducing aliens and upgrading abilities
- **Reproduction** creates new aliens with mutated traits (color, eyes, limbs, shape)
- **Camera** auto-zooms to show all aliens as the colony grows
- **Persistence** saves progress to localStorage automatically
