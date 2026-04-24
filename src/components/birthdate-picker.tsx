"use client";

import { useMemo } from "react";
import WheelPicker, { WheelOption } from "./wheel-picker";

interface BirthdatePickerProps {
  /** YYYY-MM-DD or empty string */
  value: string;
  onChange: (value: string) => void;
}

const MIN_YEAR = 1925;
const MAX_YEAR = new Date().getFullYear();
const DEFAULT_YEAR = 1990;
const DEFAULT_MONTH = 1;
const DEFAULT_DAY = 1;

function daysInMonth(year: number, month: number) {
  // month is 1-indexed
  return new Date(year, month, 0).getDate();
}

function parseValue(v: string): { year: number; month: number; day: number } {
  if (!v) return { year: DEFAULT_YEAR, month: DEFAULT_MONTH, day: DEFAULT_DAY };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return { year: DEFAULT_YEAR, month: DEFAULT_MONTH, day: DEFAULT_DAY };
  return { year: +m[1], month: +m[2], day: +m[3] };
}

function formatValue(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/**
 * Three-column iOS-style wheel picker for birthdate.
 * Default: 1990-01-01 (when value is empty).
 */
export default function BirthdatePicker({ value, onChange }: BirthdatePickerProps) {
  const { year, month, day } = parseValue(value);

  const yearOptions: WheelOption[] = useMemo(() => {
    const arr: WheelOption[] = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
      arr.push({ value: String(y), label: `${y}年` });
    }
    return arr;
  }, []);

  const monthOptions: WheelOption[] = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: String(i + 1),
        label: `${i + 1}月`,
      })),
    []
  );

  const dayOptions: WheelOption[] = useMemo(() => {
    const max = daysInMonth(year, month);
    return Array.from({ length: max }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}日`,
    }));
  }, [year, month]);

  const emit = (y: number, m: number, d: number) => {
    const maxDay = daysInMonth(y, m);
    const clampedDay = Math.min(d, maxDay);
    onChange(formatValue(y, m, clampedDay));
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <WheelPicker
        options={yearOptions}
        value={String(year)}
        onChange={(v) => emit(+v, month, day)}
        ariaLabel="年"
      />
      <WheelPicker
        options={monthOptions}
        value={String(month)}
        onChange={(v) => emit(year, +v, day)}
        ariaLabel="月"
      />
      <WheelPicker
        options={dayOptions}
        value={String(day)}
        onChange={(v) => emit(year, month, +v)}
        ariaLabel="日"
      />
    </div>
  );
}
