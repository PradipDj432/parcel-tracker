"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  role: "guest" | "user" | "admin";
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  profileError: string | null;
  isAdminUi: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  profileError: null,
  isAdminUi: false,
  isLoading: true,
  signOut: async () => {},
});

const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const profileCache = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<void> => {
    if (profileCache.current === userId) return;

    let data: Profile | null = null;
    let error: { code?: string; message?: string } | null = null;
    try {
      const queryPromise = (async () =>
        supabaseRef.current
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single())();
      const result = await withTimeout(queryPromise, 6000, "profiles query");
      data = result.data as Profile | null;
      error = result.error;
    } catch (e) {
      error = { message: e instanceof Error ? e.message : String(e) };
    }

    if (error || !data) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 300));
        return fetchProfile(userId, retries - 1);
      }
      setProfile(null);
      setProfileError(error?.message ?? "Profile row not found");
      profileCache.current = null;
      console.warn("[auth] fetchProfile failed after retries", error);
      return;
    }
    setProfile(data);
    setProfileError(null);
    profileCache.current = userId;
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseRef.current;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setProfileError(null);
        profileCache.current = null;
        setIsLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;

      if (currentUser) {
        setUser(currentUser);
        // Defer the profile fetch — Supabase's GoTrue holds a lock during
        // initial auth recovery, and awaiting another Supabase call here
        // causes a deadlock. setTimeout(..., 0) lets this callback return
        // first so the lock releases before we query.
        setTimeout(() => {
          if (!mounted) return;
          if (event === "TOKEN_REFRESHED") {
            profileCache.current = null;
          }
          fetchProfile(currentUser.id).finally(() => {
            if (mounted) setIsLoading(false);
          });
        }, 0);
      } else {
        // No session (e.g. INITIAL_SESSION with no session)
        setUser(null);
        setProfile(null);
        setProfileError(null);
        profileCache.current = null;
        setIsLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 4000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await withTimeout(
        supabaseRef.current.auth.signOut({ scope: "local" }),
        3000,
        "auth.signOut(local)"
      );
    } catch (e) {
      console.warn("[auth] signOut: client signOut failed, continuing", e);
    }
    try {
      await withTimeout(
        fetch("/api/auth/signout", { method: "POST" }),
        3000,
        "/api/auth/signout"
      );
    } catch (e) {
      console.warn("[auth] signOut: server call failed, continuing", e);
    }
    // Hard redirect — clears Next router cache and forces fresh SSR
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        profileError,
        isAdminUi: profile?.role === "admin",
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
