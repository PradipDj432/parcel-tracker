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

  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<void> => {
    if (profileCache.current === userId) return;

    // Ensure we have a valid (non-expired) token before querying.
    // getUser() forces a token refresh if the access token is expired.
    const { data: { user: validUser } } = await supabaseRef.current.auth.getUser();
    if (!validUser) return;

    const { data, error } = await supabaseRef.current
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 300));
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
        // For TOKEN_REFRESHED, allow re-fetching profile if it was previously null
        if (event === "TOKEN_REFRESHED") {
          profileCache.current = null;
        }
        await fetchProfile(currentUser.id);
      } else if (event === "INITIAL_SESSION") {
        setUser(null);
        setProfile(null);
        profileCache.current = null;
      }

      if (mounted) setIsLoading(false);
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
    // Sign out from Supabase client (clears tokens + fires SIGNED_OUT event)
    await supabaseRef.current.auth.signOut();

    // Clear server-side cookies via API
    await fetch("/api/auth/signout", { method: "POST" });

    // Hard redirect to force full page reload — clears all cached state,
    // Next.js router cache, and ensures fresh server-side render
    window.location.href = "/";
  }, []);

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
