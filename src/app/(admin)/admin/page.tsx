import { AdminClient } from "@/components/admin-client";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage users, view all tracking activity, and monitor usage.
        </p>
      </div>

      <AdminClient />
    </div>
  );
}
