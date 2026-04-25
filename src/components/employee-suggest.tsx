"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Employee } from "@/lib/types";

/**
 * Normalize a string for fuzzy 氏名 matching.
 *   - NFKC fold (full/half-width digits, half-kana → full-kana, etc.)
 *   - lower-case + strip whitespace (regular + full-width)
 *   - fold common variant kanji used in Japanese personal names so that
 *     齋藤 / 齊藤 / 斉藤 all match 斎藤, 渡邊 / 渡邉 → 渡辺,
 *     髙橋 → 高橋, 﨑 → 崎, 𠮷 → 吉, 澤 → 沢, 濱 → 浜, etc.
 */
function normalize(s: string): string {
  if (!s) return "";
  let n = s.normalize("NFKC").toLowerCase().replace(/[\s　]/g, "");
  const variants: Record<string, string> = {
    "齋": "斎", // 齋 → 斎
    "齊": "斎", // 齊 → 斎
    "斉": "斎", // 斉 → 斎
    "﨑": "崎", // 﨑 → 崎
    "嵜": "崎", // 嵜 → 崎
    "𠮷": "吉", // 𠮷 → 吉
    "髙": "高", // 髙 → 高
    "邊": "辺", // 邊 → 辺
    "邉": "辺", // 邉 → 辺
    "澤": "沢", // 澤 → 沢
    "濱": "浜", // 濱 → 浜
    "櫻": "桜", // 櫻 → 桜
    "國": "国", // 國 → 国
    "冨": "富", // 冨 → 富
    "惠": "恵", // 惠 → 恵
    "眞": "真", // 眞 → 真
    "德": "徳", // 德 → 徳
    "龍": "竜", // 龍 → 竜
    "廣": "広", // 廣 → 広
  };
  for (const [from, to] of Object.entries(variants)) {
    if (n.indexOf(from) !== -1) n = n.split(from).join(to);
  }
  return n;
}

interface EmployeeSuggestProps {
  employees: Employee[];
  excludeId?: string;
  value: Employee | null;
  onChange: (employee: Employee | null) => void;
  placeholder?: string;
}

export default function EmployeeSuggest({
  employees,
  excludeId,
  value,
  onChange,
  placeholder = "名前を入力してください",
}: EmployeeSuggestProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];
    return employees.filter((e) => {
      if (excludeId && e.id === excludeId) return false;
      return (
        normalize(e.name).includes(q) ||
        normalize(e.nameKana).includes(q) ||
        e.employeeNumber.toLowerCase().includes(q)
      );
    });
  }, [query, employees, excludeId]);

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (value) {
      onChange(null);
    }
    setIsOpen(text.trim().length > 0 && !value);
  };

  const handleSelect = (employee: Employee) => {
    onChange(employee);
    setQuery(employee.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value ? value.name : query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0 && !value) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-colors ${
            value
              ? "border-green-300 bg-green-50 text-[var(--color-warm-800)]"
              : "border-[var(--color-warm-200)] bg-white text-[var(--color-warm-800)] placeholder:text-[var(--color-warm-300)]"
          }`}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-warm-400)] hover:text-[var(--color-warm-600)] text-lg"
          >
            x
          </button>
        )}
      </div>

      {/* Selected employee badge */}
      {value && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-xs text-green-600 font-medium">
            {value.name}({value.location})
          </span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {isOpen && !value && suggestions.length > 0 && (
        <div className="absolute z-40 w-full mt-1 bg-white rounded-xl border border-[var(--color-warm-200)] shadow-lg overflow-hidden">
          {suggestions.map((emp) => (
            <button
              key={emp.id}
              onClick={() => handleSelect(emp)}
              className="w-full text-left px-4 py-2.5 hover:bg-[var(--color-warm-50)] transition-colors border-b border-[var(--color-warm-100)] last:border-b-0"
            >
              <span className="text-sm font-medium text-[var(--color-warm-800)]">
                {emp.name}
              </span>
              <span className="text-xs text-[var(--color-warm-400)] ml-2">
                {emp.location}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No match hint */}
      {query.length > 0 && suggestions.length === 0 && !value && (
        <p className="text-xs text-[var(--color-warm-400)] mt-1">
          該当する社員が見つかりません。正しい名前を入力してください。
        </p>
      )}
    </div>
  );
}
