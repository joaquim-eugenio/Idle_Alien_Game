import { useShopStore } from '../../store/shopStore';

export function AdBanner() {
  const adsRemoved = useShopStore((s) => s.adsRemoved);

  if (adsRemoved) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center"
      style={{
        height: 50,
        marginBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(10,10,26,0.9)',
        borderTop: '1px solid var(--color-ui-border)',
      }}
    >
      <span className="text-[10px]" style={{ color: 'var(--color-ui-muted)' }}>
        Ad Space (Banner)
      </span>
    </div>
  );
}
