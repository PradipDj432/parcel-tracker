"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    // Use onAuthStateChange as the single source of truth.
    // The INITIAL_SESSION event fires on mount with the cached session,
    // and TOKEN_REFRESHED fires automatically when the JWT is refreshed.
    // This avoids the race condition where getUser() (an API call) could
    // return null for an expired JWT and overwrite a valid cached session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, retries = 2) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) {
      if (retries > 0) {
        // Retry after a short delay (profile may not be created yet after signup)
        await new Promise((r) => setTimeout(r, 500));
        return fetchProfile(userId, retries - 1);
      }
      setProfile(null);
      return;
    }
    setProfile(data);
  };

  const signOut = async () => {
    // Clear client-side auth state
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    // Clear server-side session cookies
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
