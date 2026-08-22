"use client";

import dynamic from "next/dynamic";
import type { RouteStop } from "@/components/loads/load-route-map";

const LoadRouteMap = dynamic(() => import("@/components/loads/load-route-map").then((m) => m.LoadRouteMap), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-2xl bg-muted" />,
});

export function LoadRouteMapLoader({ stops }: { stops: RouteStop[] }) {
  return <LoadRouteMap stops={stops} />;
}
