import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Package } from "lucide-react";
import type { DashboardData } from "@/components/dashboard/dashboard-data";

const STATUS_LABEL: Record<string, string> = {
  booked: "Booked",
  covered: "Covered",
  pickup: "Heading to pickup",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function DriverDashboard({ data }: { data: DashboardData }) {
  const myLoads = data.activeLoads
    .slice()
    .sort((a, b) => new Date(a.pickup_date ?? 0).getTime() - new Date(b.pickup_date ?? 0).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Loads</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming pickups and deliveries assigned to you (demo data — not yet filtered to your driver record)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-muted-foreground">Assigned Loads</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{myLoads.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs font-medium text-muted-foreground">Available Trucks</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{data.availableTrucksCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Stops</CardTitle>
          <CardDescription>Sorted by pickup time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {myLoads.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No loads currently assigned.</p>
          )}
          {myLoads.map((load) => (
            <div key={load.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Package className="h-4 w-4 text-accent-teal" /> {load.load_number}
                </span>
                <Badge variant={load.risk_level === "critical" ? "danger" : load.risk_level === "warning" ? "warning" : "success"}>
                  {STATUS_LABEL[load.status] ?? load.status}
                </Badge>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {load.origin_summary} → {load.destination_summary}
              </p>
              {load.pickup_date && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Pickup {new Date(load.pickup_date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
