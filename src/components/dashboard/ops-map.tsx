"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export interface MapStop {
  id: string;
  lat: number;
  lng: number;
  label: string;
  status: "ok" | "warning" | "critical";
  type: "pickup" | "delivery";
}

const STATUS_COLOR: Record<string, string> = {
  ok: "#2ecc71",
  warning: "#f1c40f",
  critical: "#e74c3c",
};

export function OpsMap({ stops }: { stops: MapStop[] }) {
  const center: [number, number] = stops.length
    ? [
        stops.reduce((sum, s) => sum + s.lat, 0) / stops.length,
        stops.reduce((sum, s) => sum + s.lng, 0) / stops.length,
      ]
    : [39.8283, -98.5795];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Operations Map</CardTitle>
        <CardDescription>Active pickups and deliveries across the network</CardDescription>
      </CardHeader>
      <CardContent className="h-96 p-0">
        <MapContainer center={center} zoom={4} scrollWheelZoom={false} className="h-full w-full rounded-b-2xl">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {stops.map((stop) => (
            <CircleMarker
              key={stop.id}
              center={[stop.lat, stop.lng]}
              radius={7}
              pathOptions={{ color: STATUS_COLOR[stop.status], fillColor: STATUS_COLOR[stop.status], fillOpacity: 0.8 }}
            >
              <Popup>
                <span className="font-medium">{stop.label}</span>
                <br />
                {stop.type === "pickup" ? "Pickup" : "Delivery"}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
