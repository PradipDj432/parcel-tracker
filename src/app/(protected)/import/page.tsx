import { ImportWizard } from "@/components/import-wizard";

export const metadata = {
  title: "Bulk Import | Parcel Tracker",
  description: "Import multiple tracking numbers from a CSV file",
};

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bulk CSV Import</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Upload a CSV file to import multiple tracking numbers at once.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
