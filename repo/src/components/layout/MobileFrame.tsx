import { useEffect, type ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

export function MobileFrame({ children }: MobileFrameProps) {
  useEffect(() => {
    const preventDefaults = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.tagName !== 'BUTTON') {
        e.preventDefault();
      }
    };

    const preventContextMenu = (e: Event) => e.preventDefault();

    document.addEventListener('touchmove', preventDefaults, { passive: false });
    document.addEventListener('contextmenu', preventContextMenu);

    let lastTouchEnd = 0;
    const preventDoubleTap = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    document.addEventListener('touchend', preventDoubleTap, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventDefaults);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('touchend', preventDoubleTap);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'var(--color-space-dark)',
        width: '100vw',
        height: '100dvh',
      }}
    >
      {children}
    </div>
  );
}
