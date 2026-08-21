"use client";

import dynamic from "next/dynamic";
import type { MapStop } from "@/components/dashboard/ops-map";

const OpsMap = dynamic(() => import("@/components/dashboard/ops-map").then((m) => m.OpsMap), {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-2xl bg-muted" />,
});

export function OpsMapLoader({ stops }: { stops: MapStop[] }) {
  return <OpsMap stops={stops} />;
}
