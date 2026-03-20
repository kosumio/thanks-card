"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Employee } from "./types";
import { employees } from "./mock-data";

const COOKIE_NAME = "tc_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90日

function setCookie(employeeId: string) {
  document.cookie = `${COOKIE_NAME}=${employeeId}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function getCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}

function deleteCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

interface AuthContextType {
  currentUser: Employee | null;
  isLoading: boolean;
  login: (employeeNumber: string, name: string) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  login: () => null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cookie からログイン状態を復元
  useEffect(() => {
    const savedId = getCookie();
    if (savedId) {
      const emp = employees.find((e) => e.id === savedId);
      if (emp) setCurrentUser(emp);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((employeeNumber: string, name: string): string | null => {
    const emp = employees.find(
      (e) =>
        e.employeeNumber === employeeNumber.trim() &&
        e.name.replace(/\s/g, "") === name.replace(/\s/g, "").trim()
    );
    if (emp) {
      setCurrentUser(emp);
      setCookie(emp.id);
      return null;
    }
    return "従業員番号または名前が正しくありません";
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    deleteCookie();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
