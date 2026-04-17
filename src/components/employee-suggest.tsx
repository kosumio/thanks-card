"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Employee } from "@/lib/types";

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
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return employees.filter((e) => {
      if (excludeId && e.id === excludeId) return false;
      return (
        e.name.toLowerCase().includes(q) ||
        e.nameKana.toLowerCase().includes(q) ||
        e.employeeNumber.includes(q)
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
