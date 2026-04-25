"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Employee } from "@/lib/types";

/**
 * Normalize a string for fuzzy name matching:
 *   - lower-case
 *   - strip all whitespace (regular + full-width)
 *   - fold variant kanji (岩﨑 -> 岩崎, 齋 -> 斎, 𠮷 -> 吉, 髙 -> 高)
 *   - fold half-width katakana to full-width
 */
function normalize(s: string): string {
  if (!s) return "";
  let n = s.toLowerCase().replace(/[\s\u3000]/g, "");
  // Variant kanji folding (common ones in this roster)
  n = n
    .replace(/﨑/g, "崎")
    .replace(/齋/g, "斎")
    .replace(/𠮷/g, "吉")
    .replace(/髙/g, "高");
  // Half-width katakana → full-width
  n = n.replace(/[\uff61-\uff9f]/g, (ch) => {
    const code = ch.charCodeAt(0);
    // ｦ-ｯ (small kana) and others fall back via NFKC
    return String.fromCharCode(code).normalize("NFKC");
  });
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
