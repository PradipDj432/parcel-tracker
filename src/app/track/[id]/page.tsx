import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { ShareQrCode } from "@/components/share-qr-code";
import type { Parcel, TrackingStatus } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPublicTracking(slug: string): Promise<Parcel | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trackings")
    .select("*")
    .eq("public_slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !data) return null;
  return data as Parcel;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tracking = await getPublicTracking(id);

  if (!tracking) {
    return { title: "Tracking Not Found | Parcel Tracker" };
  }

  const title = `${tracking.tracking_number} — ${tracking.courier_code.toUpperCase()} | Parcel Tracker`;
  const description = tracking.last_event || `Track parcel ${tracking.tracking_number}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [`/api/og/${id}`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/${id}`],
    },
  };
}

export default async function SharedTrackingPage({ params }: PageProps) {
  const { id } = await params;
  const tracking = await getPublicTracking(id);

  if (!tracking) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
              Tracking Number
            </p>
            <p className="mt-1 truncate font-mono text-lg font-bold">
              {tracking.tracking_number}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {tracking.courier_code.toUpperCase()}
            </p>
          </div>
          <StatusBadge status={tracking.status as TrackingStatus} />
        </div>

        {/* Meta info */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800 sm:grid-cols-3">
          {tracking.origin && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Origin</p>
              <p className="font-medium">{tracking.origin}</p>
            </div>
          )}
          {tracking.destination && (
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Destination</p>
              <p className="font-medium">{tracking.destination}</p>
            </div>
          )}
          {tracking.last_event && (
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Last Event</p>
              <p className="font-medium">{tracking.last_event}</p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
          Tracking History
        </h2>
        <TrackingTimeline checkpoints={tracking.checkpoints} />
      </div>

      {/* QR Code + Share */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold uppercase text-zinc-500 dark:text-zinc-400">
          Share This Tracking
        </h2>
        <ShareQrCode slug={tracking.public_slug!} />
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Shared via Parcel Tracker
      </p>
    </div>
  );
}
