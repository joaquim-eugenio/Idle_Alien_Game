import { useEffect, type ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

function isInsideScrollable(target: HTMLElement | null): boolean {
  let el = target;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    const isScrollableY = (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth;
    if (isScrollableY || isScrollableX) return true;
    el = el.parentElement;
  }
  return false;
}

export function MobileFrame({ children }: MobileFrameProps) {
  useEffect(() => {
    const preventDefaults = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'BUTTON') return;
      if (isInsideScrollable(target)) return;
      e.preventDefault();
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
