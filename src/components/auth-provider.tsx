"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const profileCache = useRef<string | null>(null);
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string, retries = 2): Promise<void> => {
    // Skip if we already have this profile cached
    if (profileCache.current === userId) return;

    const { data, error } = await supabaseRef.current
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return fetchProfile(userId, retries - 1);
      }
      setProfile(null);
      profileCache.current = null;
      return;
    }
    setProfile(data);
    profileCache.current = userId;
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = supabaseRef.current;

    // Listen for auth state changes. This fires INITIAL_SESSION on mount,
    // TOKEN_REFRESHED when the token is refreshed, and SIGNED_IN/SIGNED_OUT.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        profileCache.current = null;
        setIsLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;

      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.id);
      } else if (event === "INITIAL_SESSION") {
        // No session at all on initial load — user is guest
        setUser(null);
        setProfile(null);
        profileCache.current = null;
      }

      if (mounted) setIsLoading(false);
    });

    // Safety net: if onAuthStateChange never fires within 3 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    // Clear client state first so UI updates immediately
    setUser(null);
    setProfile(null);
    profileCache.current = null;

    // Sign out from Supabase (clears client-side tokens)
    await supabaseRef.current.auth.signOut();

    // Clear server-side session cookies
    await fetch("/api/auth/signout", { method: "POST" });

    // Refresh the router to clear any cached server components
    router.refresh();
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === "admin",
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
