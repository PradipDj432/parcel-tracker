"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const supabase = createClient();
  const profileCache = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1. Read session from cookies immediately (no API call).
    //    This gives us the user even if the access token is expired,
    //    so the navbar renders correctly right away.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    // 2. Listen for auth state changes (INITIAL_SESSION, TOKEN_REFRESHED,
    //    SIGNED_IN, SIGNED_OUT). This handles token refresh and login/logout.
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
      }
      // Only clear user if explicitly signed out (handled above).
      // Don't clear on INITIAL_SESSION with null — getSession() above
      // may have already set the user from cookies.

      setIsLoading(false);
    });

    // 3. Safety net: if nothing resolved within 2 seconds, stop loading
    const timeout = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 2000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const fetchProfile = async (userId: string, retries = 2): Promise<void> => {
    // Skip if we already have this profile cached
    if (profileCache.current === userId && profile) return;

    const { data, error } = await supabase
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
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    profileCache.current = null;
    await fetch("/api/auth/signout", { method: "POST" });
  };

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
