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
import { createClient } from "./supabase/client";
import { logoutAction } from "./actions";

interface AuthContextType {
  currentUser: Employee | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: Employee | null;
  children: ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const refreshUser = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUser(null);
        return;
      }
      // Query employees table for the authenticated user
      const { data: emp } = await supabase
        .from("employees")
        .select("id, employee_number, name, name_kana, location, is_admin")
        .eq("id", user.id)
        .single();

      if (emp) {
        setCurrentUser({
          id: emp.id,
          employeeNumber: emp.employee_number,
          name: emp.name,
          nameKana: emp.name_kana,
          location: emp.location,
          isAdmin: emp.is_admin,
        });
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutAction();
    setCurrentUser(null);
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        refreshUser();
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null);
      }
    });

    // If no initial user, check auth state
    if (!initialUser) {
      refreshUser().then(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [initialUser, refreshUser]);

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
