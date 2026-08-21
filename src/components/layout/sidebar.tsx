"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Building2,
  User,
  FileText,
  AlertTriangle,
  Bot,
  DollarSign,
  Settings,
  Calculator,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/loads", label: "Loads", icon: Package },
  { href: "/dispatch", label: "Dispatch", icon: Truck },
  { href: "/quotes", label: "Quoting", icon: Calculator },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/carriers", label: "Carriers", icon: Building2 },
  { href: "/drivers", label: "Drivers", icon: User },
  { href: "/fleet", label: "Fleet", icon: Truck },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/exceptions", label: "Exceptions", icon: AlertTriangle },
  { href: "/ai", label: "AI Command Center", icon: Bot },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-teal text-sm font-bold text-primary-dark">
          AF
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">Autonomous Freight</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-teal/15 text-accent-teal"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
