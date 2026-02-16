"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { StatusBadge } from "@/components/status-badge";
import { ChevronDown, Users, Package, MessageSquare } from "lucide-react";
import type { TrackingStatus } from "@/types";

// ---- Types ----

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  tracking_count: number;
  last_active: string | null;
}

interface AdminTracking {
  id: string;
  tracking_number: string;
  courier_code: string;
  status: string;
  last_event?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip_address: string;
  created_at: string;
}

interface AdminStats {
  totalUsers: number;
  totalTrackings: number;
  totalContacts: number;
  mostActive: AdminUser[];
  statusBreakdown: Record<string, number>;
  courierBreakdown: Record<string, number>;
}

interface AdminData {
  users: AdminUser[];
  trackings: AdminTracking[];
  contacts: ContactSubmission[];
  stats: AdminStats;
}

type Tab = "overview" | "users" | "trackings" | "contacts";

// ---- Component ----

export function AdminClient() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <AdminSkeleton />;
  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        Failed to load admin data.
      </p>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users", count: data.stats.totalUsers },
    { key: "trackings", label: "Trackings", count: data.stats.totalTrackings },
    { key: "contacts", label: "Messages", count: data.stats.totalContacts },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab stats={data.stats} />}
      {tab === "users" && <UsersTab users={data.users} />}
      {tab === "trackings" && <TrackingsTab trackings={data.trackings} users={data.users} />}
      {tab === "contacts" && <ContactsTab contacts={data.contacts} />}
    </div>
  );
}

// ---- Overview Tab ----

function OverviewTab({ stats }: { stats: AdminStats }) {
  const statusEntries = Object.entries(stats.statusBreakdown).sort(
    (a, b) => b[1] - a[1]
  );
  const courierEntries = Object.entries(stats.courierBreakdown).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={stats.totalUsers} color="blue" />
        <StatCard
          label="Total Trackings"
          value={stats.totalTrackings}
          color="amber"
        />
        <StatCard
          label="Contact Messages"
          value={stats.totalContacts}
          color="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-semibold">Tracking Status Breakdown</h3>
          {statusEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">No trackings yet.</p>
          ) : (
            <div className="space-y-2">
              {statusEntries.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <StatusBadge status={status as TrackingStatus} />
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Courier breakdown */}
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-semibold">Courier Breakdown</h3>
          {courierEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">No trackings yet.</p>
          ) : (
            <div className="space-y-2">
              {courierEntries.map(([courier, count]) => (
                <div key={courier} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {courier}
                  </span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Most active users */}
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h3 className="mb-3 text-sm font-semibold">Most Active Users</h3>
        {stats.mostActive.length === 0 ? (
          <p className="text-sm text-zinc-500">No users yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.mostActive.map((u, i) => (
              <div
                key={u.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium dark:bg-zinc-800">
                    {i + 1}
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {u.email}
                  </span>
                </div>
                <span className="font-medium">
                  {u.tracking_count} tracking{u.tracking_count !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Users Tab ----

function UsersTab({ users }: { users: AdminUser[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="guest">Guest</option>
        </select>
        <span className="text-xs text-zinc-500">{filtered.length} user(s)</span>
      </div>

      {/* Table header */}
      <div className="hidden items-center gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase text-zinc-500 sm:flex dark:border-zinc-800">
        <span className="flex-1">Email</span>
        <span className="w-20">Role</span>
        <span className="w-24">Trackings</span>
        <span className="w-32">Last Active</span>
        <span className="w-32">Joined</span>
      </div>

      {/* User rows */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No users found.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 dark:border-zinc-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{u.email}</p>
              </div>
              <span className="w-20">
                <RoleBadge role={u.role} />
              </span>
              <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400">
                {u.tracking_count}
              </span>
              <span className="w-32 text-xs text-zinc-500 dark:text-zinc-400">
                {u.last_active
                  ? new Date(u.last_active).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
              <span className="w-32 text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(u.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Trackings Tab ----

function TrackingsTab({
  trackings,
  users,
}: {
  trackings: AdminTracking[];
  users: AdminUser[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const emailMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of users) m[u.id] = u.email;
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    return trackings.filter((t) => {
      const matchSearch =
        !search ||
        t.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
        t.courier_code.toLowerCase().includes(search.toLowerCase()) ||
        (t.user_id && emailMap[t.user_id]?.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [trackings, search, statusFilter, emailMap]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search number, courier, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="transit">In Transit</option>
          <option value="delivered">Delivered</option>
          <option value="pickup">Picked Up</option>
          <option value="exception">Exception</option>
          <option value="expired">Expired</option>
          <option value="notfound">Not Found</option>
        </select>
        <span className="text-xs text-zinc-500">
          {filtered.length} tracking(s)
        </span>
      </div>

      {/* Table header */}
      <div className="hidden items-center gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase text-zinc-500 sm:flex dark:border-zinc-800">
        <span className="flex-1">Tracking Number</span>
        <span className="w-24">Courier</span>
        <span className="w-24">Status</span>
        <span className="w-40">User</span>
        <span className="w-32">Updated</span>
      </div>

      {/* Tracking rows */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No trackings found.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 dark:border-zinc-800"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm font-medium">
                  {t.tracking_number}
                </p>
                {t.last_event && (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {t.last_event}
                  </p>
                )}
              </div>
              <span className="w-24 text-sm text-zinc-600 dark:text-zinc-400">
                {t.courier_code}
              </span>
              <div className="w-24">
                <StatusBadge status={t.status as TrackingStatus} />
              </div>
              <span className="w-40 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {t.user_id ? emailMap[t.user_id] || "Unknown" : "Guest"}
              </span>
              <span className="w-32 text-xs text-zinc-500 dark:text-zinc-400">
                {new Date(t.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Contacts Tab ----

function ContactsTab({ contacts }: { contacts: ContactSubmission[] }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search messages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
        <span className="text-xs text-zinc-500">
          {filtered.length} message(s)
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No contact submissions found.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <button
                onClick={() => toggleExpand(c.id)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.subject || "(No subject)"}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {c.name} &lt;{c.email}&gt;
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ${
                    expanded.has(c.id) ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expanded.has(c.id) && (
                <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      <strong>From:</strong> {c.name} &lt;{c.email}&gt;
                    </span>
                    <span>
                      <strong>IP:</strong> {c.ip_address || "—"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                    {c.message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Shared Components ----

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "amber" | "green";
}) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    amber: "text-amber-600 dark:text-amber-400",
    green: "text-green-600 dark:text-green-400",
  };

  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </p>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    user: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    guest:
      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[role] || styles.guest
      }`}
    >
      {role}
    </span>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-zinc-200 pb-2 dark:border-zinc-800">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-5 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700"
          />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-2 h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <div className="flex items-center gap-4">
              <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
