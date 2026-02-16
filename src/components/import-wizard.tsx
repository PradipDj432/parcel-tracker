"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";

type Step = "upload" | "review" | "processing" | "summary";

interface CsvRow {
  id: string;
  trackingNumber: string;
  courierCode: string;
  label: string;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  trackingNumber: string;
  success: boolean;
  error?: string;
  status?: string;
}

const BATCH_SIZE = 3; // Process 3 at a time to avoid rate limits

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV
  const parseFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (result) => {
        const parsed: CsvRow[] = (result.data as Record<string, string>[]).map(
          (row, i) => {
            const trackingNumber = (
              row.tracking_number ||
              row.trackingnumber ||
              row.tracking ||
              row.number ||
              ""
            ).trim();
            const courierCode = (
              row.courier_code ||
              row.couriercode ||
              row.courier ||
              row.carrier ||
              ""
            ).trim();
            const label = (row.label || row.name || row.description || "").trim();

            let valid = true;
            let error: string | undefined;

            if (!trackingNumber) {
              valid = false;
              error = "Missing tracking number";
            } else if (!courierCode) {
              valid = false;
              error = "Missing courier code";
            }

            return {
              id: `row-${i}`,
              trackingNumber,
              courierCode,
              label,
              valid,
              error,
            };
          }
        );

        setRows(parsed);
        setStep("review");
      },
      error: () => {
        setRows([]);
      },
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        parseFile(file);
      }
    },
    [parseFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof CsvRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        // Revalidate
        if (updated.trackingNumber && updated.courierCode) {
          updated.valid = true;
          updated.error = undefined;
        } else {
          updated.valid = false;
          updated.error = !updated.trackingNumber
            ? "Missing tracking number"
            : "Missing courier code";
        }
        return updated;
      })
    );
  };

  // Process in batches
  const processImport = async () => {
    const validRows = rows.filter((r) => r.valid);
    setTotalToProcess(validRows.length);
    setProgress(0);
    setResults([]);
    setStep("processing");

    const allResults: ImportResult[] = [];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (row) => {
          try {
            const res = await fetch("/api/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                trackingNumber: row.trackingNumber,
                courierCode: row.courierCode,
                label: row.label,
              }),
            });
            const json = await res.json();
            return {
              trackingNumber: row.trackingNumber,
              success: json.success ?? false,
              error: json.error,
              status: json.status,
            };
          } catch {
            return {
              trackingNumber: row.trackingNumber,
              success: false,
              error: "Request failed",
            };
          }
        })
      );

      allResults.push(...batchResults);
      setResults([...allResults]);
      setProgress(Math.min(allResults.length, validRows.length));
    }

    setStep("summary");
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <div className="space-y-6">
      {/* Step: Upload */}
      {step === "upload" && (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 transition-colors ${
              isDragOver
                ? "border-zinc-500 bg-zinc-50 dark:border-zinc-400 dark:bg-zinc-900"
                : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="mt-4 text-sm font-medium">
              Drop your CSV file here or click to browse
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Required columns: tracking_number, courier_code. Optional: label
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="text-sm font-medium">CSV Format Example</h3>
            <pre className="mt-2 overflow-x-auto text-xs text-zinc-500 dark:text-zinc-400">
{`tracking_number,courier_code,label
EA152563254CN,china-ems,My Package
9400111899223456789012,usps,Gift for Mom
JD0012345678901234,ups,Office Supplies`}
            </pre>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">
                <strong>{validCount}</strong> valid,{" "}
                {invalidCount > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    <strong>{invalidCount}</strong> invalid
                  </span>
                )}
                {invalidCount === 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    0 invalid
                  </span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep("upload");
                  setRows([]);
                }}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Re-upload
              </button>
              <button
                onClick={processImport}
                disabled={validCount === 0}
                className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Import {validCount} tracking(s)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Tracking Number</th>
                  <th className="px-3 py-2 font-medium">Courier</th>
                  <th className="px-3 py-2 font-medium">Label</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-zinc-100 dark:border-zinc-800/50 ${
                      !row.valid
                        ? "bg-red-50 dark:bg-red-950/20"
                        : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-zinc-400">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.trackingNumber}
                        onChange={(e) =>
                          updateRow(row.id, "trackingNumber", e.target.value)
                        }
                        className="w-full rounded border border-zinc-200 px-2 py-1 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.courierCode}
                        onChange={(e) =>
                          updateRow(row.id, "courierCode", e.target.value)
                        }
                        className="w-full rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={row.label}
                        onChange={(e) =>
                          updateRow(row.id, "label", e.target.value)
                        }
                        className="w-full rounded border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Valid
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {row.error}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeRow(row.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Importing trackings...</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {progress} of {totalToProcess} processed
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-white"
              style={{
                width: `${totalToProcess > 0 ? (progress / totalToProcess) * 100 : 0}%`,
              }}
            />
          </div>

          {/* Live results */}
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded px-3 py-1.5 text-xs"
              >
                {r.success ? (
                  <span className="text-green-600 dark:text-green-400">
                    OK
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    FAIL
                  </span>
                )}
                <span className="font-mono">{r.trackingNumber}</span>
                {r.error && (
                  <span className="text-zinc-400">— {r.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step: Summary */}
      {step === "summary" && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Import Complete</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
              <p className="text-xs text-green-600 dark:text-green-400">
                Succeeded
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {results.filter((r) => r.success).length}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/30">
              <p className="text-xs text-red-600 dark:text-red-400">Failed</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {results.filter((r) => !r.success).length}
              </p>
            </div>
          </div>

          {/* Failed details */}
          {results.some((r) => !r.success) && (
            <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="mb-2 text-sm font-medium">Failed Items</h3>
              <div className="space-y-1">
                {results
                  .filter((r) => !r.success)
                  .map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono">{r.trackingNumber}</span>
                      <span className="text-red-500">{r.error}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setStep("upload");
                setRows([]);
                setResults([]);
              }}
              className="rounded-md px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Import more
            </button>
            <a
              href="/history"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              View history
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
