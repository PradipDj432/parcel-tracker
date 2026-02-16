"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function ShareQrCode({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/track/${slug}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-white">
        <QRCodeSVG value={url} size={120} />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Scan the QR code or share the link below:
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="min-w-0 flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={copyLink}
            className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
