import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function KpiCard({
  label,
  value,
  changePct,
  changeDirection,
  goodDirection = "up",
}: {
  label: string;
  value: string;
  changePct: number;
  changeDirection: "up" | "down";
  goodDirection?: "up" | "down";
}) {
  const isGood = changeDirection === goodDirection;
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-medium",
            isGood ? "text-success" : "text-danger",
          )}
        >
          {changeDirection === "up" ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {changePct.toFixed(1)}%
        </div>
      </CardContent>
    </Card>
  );
}
