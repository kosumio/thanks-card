"use client";

import { useEffect, useRef, useCallback } from "react";

export interface WheelOption {
  value: string;
  label: string;
}

interface WheelPickerProps {
  options: WheelOption[];
  value: string;
  onChange: (value: string) => void;
  itemHeight?: number;
  visibleCount?: number;
  ariaLabel?: string;
}

/**
 * iOS-style wheel picker — single column.
 * Uses CSS scroll-snap + native scroll (smooth on mobile, no external deps).
 * Center item (selected) is highlighted via the parent's gradient mask.
 */
export default function WheelPicker({
  options,
  value,
  onChange,
  itemHeight = 40,
  visibleCount = 5,
  ariaLabel,
}: WheelPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitted = useRef<string>(value);
  const padding = Math.floor(visibleCount / 2) * itemHeight;

  // Scroll to current value when it changes externally
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = options.findIndex((o) => o.value === value);
    if (idx < 0) return;
    const targetTop = idx * itemHeight;
    if (Math.abs(el.scrollTop - targetTop) > 2) {
      el.scrollTop = targetTop;
    }
    lastEmitted.current = value;
  }, [value, options, itemHeight]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(options.length - 1, idx));
      const picked = options[clamped]?.value;
      if (picked !== undefined && picked !== lastEmitted.current) {
        lastEmitted.current = picked;
        onChange(picked);
      }
      // Snap to exact position
      const exact = clamped * itemHeight;
      if (Math.abs(el.scrollTop - exact) > 1) {
        el.scrollTo({ top: exact, behavior: "smooth" });
      }
    }, 100);
  }, [itemHeight, options, onChange]);

  const handleItemClick = useCallback(
    (idx: number) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
    },
    [itemHeight]
  );

  const totalHeight = itemHeight * visibleCount;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-[var(--color-warm-50)] border border-[var(--color-warm-200)]"
      style={{ height: totalHeight }}
      aria-label={ariaLabel}
    >
      {/* Selection highlight band */}
      <div
        className="pointer-events-none absolute left-0 right-0 border-y border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5"
        style={{
          top: padding,
          height: itemHeight,
        }}
      />
      {/* Top/bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[var(--color-warm-50)] to-transparent z-10"
        style={{ height: padding }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-warm-50)] to-transparent z-10"
        style={{ height: padding }}
      />

      {/* Scrollable column */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll scrollbar-hide"
        style={{
          scrollSnapType: "y mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ paddingTop: padding, paddingBottom: padding }}>
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => handleItemClick(idx)}
                className={`flex items-center justify-center w-full text-center transition-colors ${
                  isSelected
                    ? "text-[var(--color-warm-800)] font-semibold"
                    : "text-[var(--color-warm-400)]"
                }`}
                style={{
                  height: itemHeight,
                  scrollSnapAlign: "center",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
