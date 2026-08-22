"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export interface RouteStop {
  id: string;
  lat: number;
  lng: number;
  label: string;
  stop_type: "pickup" | "delivery";
}

const STOP_COLOR: Record<string, string> = {
  pickup: "#0077b6",
  delivery: "#00b4d8",
};

export function LoadRouteMap({ stops }: { stops: RouteStop[] }) {
  const [path, setPath] = useState<[number, number][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stops.length < 2) return;
    let cancelled = false;
    fetch("/api/geo/route-line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stops: stops.map((s) => ({ lat: s.lat, lng: s.lng })) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setPath(data.path);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load route");
      });
    return () => {
      cancelled = true;
    };
  }, [stops]);

  const center: [number, number] = stops.length
    ? [stops.reduce((sum, s) => sum + s.lat, 0) / stops.length, stops.reduce((sum, s) => sum + s.lng, 0) / stops.length]
    : [39.8283, -98.5795];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Map</CardTitle>
        <CardDescription>{error ?? "Actual driving route between stops"}</CardDescription>
      </CardHeader>
      <CardContent className="h-80 p-0">
        <MapContainer center={center} zoom={5} scrollWheelZoom={false} className="h-full w-full rounded-b-2xl">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {path && <Polyline positions={path} pathOptions={{ color: "#0077b6", weight: 4, opacity: 0.75 }} />}
          {stops.map((stop) => (
            <CircleMarker
              key={stop.id}
              center={[stop.lat, stop.lng]}
              radius={8}
              pathOptions={{ color: STOP_COLOR[stop.stop_type], fillColor: STOP_COLOR[stop.stop_type], fillOpacity: 0.9 }}
            >
              <Popup>
                <span className="font-medium">{stop.label}</span>
                <br />
                {stop.stop_type === "pickup" ? "Pickup" : "Delivery"}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
