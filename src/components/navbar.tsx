"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Package,
  Search,
  Mail,
  LayoutDashboard,
  History,
  Upload,
  ShieldCheck,
  LogOut,
  Loader2,
  Menu,
  X,
  UserCircle,
} from "lucide-react";

const navLink =
  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white";

const navLinkActive =
  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white";

export function Navbar() {
  const { user, profile, isAdminUi, isLoading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!confirmLogoutOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoggingOut) setConfirmLogoutOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmLogoutOpen, isLoggingOut]);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch {
      setIsLoggingOut(false);
      setConfirmLogoutOpen(false);
    }
  };

  const isActive = (href: string) => pathname === href;

  const links = [
    { href: "/track", label: "Track", icon: Search, auth: false },
    { href: "/contact", label: "Contact", icon: Mail, auth: false },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, auth: true },
    { href: "/history", label: "History", icon: History, auth: true },
    { href: "/import", label: "Import", icon: Upload, auth: true },
  ];

  return (
    <>
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <Package className="h-5 w-5" />
          <span className="hidden sm:inline">Parcel Tracker</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-0.5 md:flex">
          {links
            .filter((l) => !l.auth || (!isLoading && user))
            .map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={isActive(l.href) ? navLinkActive : navLink}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}

          {!isLoading && user && isAdminUi && (
            <Link
              href="/admin"
              className={
                isActive("/admin")
                  ? "flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
              }
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}

          <div className="ml-2 flex items-center gap-1.5 border-l border-zinc-200 pl-2 dark:border-zinc-700">
            <ThemeToggle />

            {!isLoading && (
              <>
                {user ? (
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/profile"
                      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="View profile"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span className="max-w-[100px] truncate">
                        {profile?.email}
                      </span>
                    </Link>
                    <button
                      onClick={() => setConfirmLogoutOpen(true)}
                      className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      title="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Link
                      href="/login"
                      className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-1.5 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-slide-down border-t border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800">
          <div className="flex flex-col gap-1">
            {links
              .filter((l) => !l.auth || (!isLoading && user))
              .map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={isActive(l.href) ? navLinkActive : navLink}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              ))}

            {!isLoading && user && isAdminUi && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}

            <div className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-700">
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <UserCircle className="h-4 w-4" />
                        {profile?.email}
                      </Link>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          setConfirmLogoutOpen(true);
                        }}
                        className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileOpen(false)}
                        className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>

    {mounted && confirmLogoutOpen &&
      createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!isLoggingOut) setConfirmLogoutOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
        >
          <div
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="logout-dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-white"
            >
              Sign out?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {isLoggingOut
                ? "Signing you out…"
                : "Are you sure you want to sign out?"}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmLogoutOpen(false)}
                disabled={isLoggingOut}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                autoFocus
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoggingOut && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                {isLoggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
