import { motion } from 'framer-motion';
import { useShopStore } from '../../store/shopStore';

interface ShopModalProps {
  onClose: () => void;
}

export function ShopModal({ onClose }: ShopModalProps) {
  const products = useShopStore((s) => s.products);
  const purchase = useShopStore((s) => s.purchase);
  const adsRemoved = useShopStore((s) => s.adsRemoved);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative w-[90%] max-w-sm rounded-2xl p-5 max-h-[75dvh] overflow-y-auto"
        style={{
          background: 'var(--color-ui-surface)',
          border: '1px solid var(--color-ui-border)',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
        }}
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-ui-text)' }}>
            Shop
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--color-ui-text)' }}
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {products.map((product) => {
            const isBought = product.type === 'remove_ads' && adsRemoved;

            return (
              <motion.button
                key={product.id}
                className="flex items-center gap-3 p-3 rounded-xl text-left active:scale-98 transition-transform"
                style={{
                  background: isBought ? 'rgba(57,255,20,0.1)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isBought ? 'rgba(57,255,20,0.3)' : 'var(--color-ui-border)'}`,
                  opacity: isBought ? 0.6 : 1,
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => !isBought && purchase(product.id)}
                disabled={isBought}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  {product.type === 'energy_pack' ? '⚡' : product.type === 'remove_ads' ? '🚫' : '🎁'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: 'var(--color-ui-text)' }}>
                    {product.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-ui-muted)' }}>
                    {product.description}
                  </div>
                </div>
                <div
                  className="text-sm font-bold shrink-0"
                  style={{ color: isBought ? 'var(--color-energy-green)' : 'var(--color-ui-text)' }}
                >
                  {isBought ? '✓' : product.price}
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-[10px] mt-4 text-center" style={{ color: 'var(--color-ui-muted)' }}>
          Purchases are simulated in development mode
        </p>
      </motion.div>
    </motion.div>
  );
}
