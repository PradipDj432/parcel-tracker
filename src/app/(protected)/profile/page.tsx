"use client";

import { useAuth } from "@/components/auth-provider";
import { User, ShieldCheck, Mail, Calendar, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-zinc-500">Unable to load profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Your account information.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {/* Avatar / Icon */}
        <div className="flex items-center gap-4 border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <User className="h-7 w-7 text-zinc-500 dark:text-zinc-400" />
          </div>
          <div>
            <p className="font-medium">{profile.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                  <ShieldCheck className="h-3 w-3" />
                  Admin
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  User
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="flex items-center gap-3 px-6 py-4">
            <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Email</p>
              <p className="text-sm font-medium">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <ShieldCheck className="h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Role</p>
              <p className="text-sm font-medium capitalize">{profile.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Member since
              </p>
              <p className="text-sm font-medium">
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Profile information is managed by the system and cannot be edited.
          </p>
        </div>
      </div>
    </div>
  );
}
