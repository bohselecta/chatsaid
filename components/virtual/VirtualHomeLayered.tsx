'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { VH_BACKGROUNDS, VH_DESKS } from '@/lib/virtual/homeAssets';

export type VirtualHomeItem = {
  id: string;
  src: string;
  alt: string;
  xPct: number; // 0-100
  yPct: number; // 0-100
  widthPct?: number; // 0-100, defaults to 12
  z?: number; // stacking order
};

interface Props {
  backgroundUrl: string;
  deskUrl: string;
  items?: VirtualHomeItem[];
  editable?: boolean;
  onChange?: (items: VirtualHomeItem[]) => void;
  children?: React.ReactNode;
}

/**
 * Layered, responsive virtual home scene.
 * - Max width 550px, fixed aspect ~4:3 using padding-bottom hack (75%).
 * - Background fills, desk pinned bottom, items absolutely positioned via percentages.
 */
export default function VirtualHomeLayered({
  backgroundUrl,
  deskUrl,
  items = [],
  editable = false,
  onChange,
  children,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localItems, setLocalItems] = useState<VirtualHomeItem[]>(items);

  // Keep internal state in sync when parent updates items
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sortedItems = useMemo(() => {
    return [...localItems].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  }, [localItems]);

  // Try to map given URLs to responsive asset descriptors by id or base token
  const bgAsset = useMemo(() => {
    const token = (backgroundUrl || '').toLowerCase();
    const extOk = token.endsWith('.jpg') || token.endsWith('.jpeg') || token.endsWith('.png');
    if (!extOk) return null;
    return (
      VH_BACKGROUNDS.find(
        (b) => token.includes(`/bg-${b.id}`) || token.includes(`/${b.id}`)
      ) || null
    );
  }, [backgroundUrl]);

  const deskAsset = useMemo(() => {
    const token = (deskUrl || '').toLowerCase();
    const extOk = token.endsWith('.jpg') || token.endsWith('.jpeg') || token.endsWith('.png');
    if (!extOk) return null;
    return (
      VH_DESKS.find(
        (d) => token.includes(`/desk-${d.id}`) || token.includes(`/${d.id}`)
      ) || null
    );
  }, [deskUrl]);

  const handleDragEnd = useCallback(
    (id: string, evt: MouseEvent | TouchEvent | PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let clientX = 0;
      let clientY = 0;
      if ('clientX' in evt) {
        clientX = (evt as MouseEvent).clientX;
        clientY = (evt as MouseEvent).clientY;
      } else if ('changedTouches' in evt && (evt as TouchEvent).changedTouches?.length) {
        clientX = (evt as TouchEvent).changedTouches[0].clientX;
        clientY = (evt as TouchEvent).changedTouches[0].clientY;
      }

      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      const xPct = Math.max(0, Math.min(100, (relX / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, (relY / rect.height) * 100));

      setLocalItems((prev) => {
        const next = prev.map((it) => (it.id === id ? { ...it, xPct, yPct } : it));
        if (onChange) onChange(next);
        return next;
      });
    },
    [onChange]
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className="relative w-full max-w-[550px] bg-black/5 rounded-lg overflow-hidden"
      >
        {/* aspect ratio 4:3 via padding-bottom */}
        <div className="pointer-events-none" style={{ paddingBottom: '75%' }} />

        {/* Layers wrapper */}
        <div className="absolute inset-0">
          {/* Background layer (responsive when descriptors available) */}
          {bgAsset ? (
            <picture>
              <source srcSet={bgAsset.srcset} sizes={bgAsset.sizes} type="image/webp" />
              <img
                src={bgAsset.fallback}
                alt={bgAsset.alt}
                className="absolute inset-0 h-full w-full object-cover select-none"
                style={{ backgroundImage: `url(${bgAsset.blur})`, backgroundSize: 'cover' }}
                decoding="async"
                loading="eager"
                draggable={false}
              />
            </picture>
          ) : (
            <img
              src={backgroundUrl}
              alt="Virtual home background"
              className="absolute inset-0 h-full w-full object-cover select-none"
              draggable={false}
            />
          )}

          {/* Items layer */}
          <div className="absolute inset-0">
            {sortedItems.map((item) => {
              const style: React.CSSProperties = {
                left: `${item.xPct}%`,
                top: `${item.yPct}%`,
                width: `${item.widthPct ?? 12}%`,
                zIndex: 10 + (item.z ?? 0),
                transform: 'translate(-50%, -50%)',
              };

              if (editable) {
                return (
                  <motion.img
                    key={item.id}
                    src={item.src}
                    alt={item.alt}
                    className="absolute cursor-grab active:cursor-grabbing drop-shadow"
                    style={style}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(_e, info) => {
                      // info.point contains page coords; synthesize a PointerEvent-like shape
                      const fakeEvt = new PointerEvent('pointerup', {
                        clientX: info.point.x,
                        clientY: info.point.y,
                      });
                      handleDragEnd(item.id, fakeEvt);
                    }}
                  />
                );
              }

              return (
                <img
                  key={item.id}
                  src={item.src}
                  alt={item.alt}
                  className="absolute drop-shadow"
                  style={style}
                  draggable={false}
                />
              );
            })}
          </div>

          {/* Desk layer pinned to bottom (responsive when descriptors available) */}
          {deskAsset ? (
            <picture>
              <source srcSet={deskAsset.srcset} sizes={deskAsset.sizes} type="image/webp" />
              <img
                src={deskAsset.fallback}
                alt={deskAsset.alt}
                className="absolute inset-x-0 bottom-0 w-full object-contain select-none"
                style={{ backgroundImage: `url(${deskAsset.blur})`, backgroundSize: 'cover' }}
                decoding="async"
                loading="lazy"
                draggable={false}
              />
            </picture>
          ) : (
            <img
              src={deskUrl}
              alt="Desk"
              className="absolute bottom-0 left-0 right-0 w-full object-contain select-none"
              draggable={false}
            />
          )}
          {/* Custom overlay children (e.g., click hotspots) */}
          {children}
        </div>
      </div>

      {!editable && (
        <div className="mt-2 text-xs text-[var(--muted)]">
          View-only · edit from profile
        </div>
      )}
    </div>
  );
}
