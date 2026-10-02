"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Laptop } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings.store";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const businessName = useSettingsStore((state) => state.settings.businessName);
  const address = useSettingsStore((state) => state.settings.address);
  const [brand, ...rest] = businessName.split(" ");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Laptop className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">{brand}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rest.join(" ") || "Technologies"}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border px-4 py-4">
        <p className="text-xs text-muted-foreground">{address}</p>
        <p className="text-xs text-muted-foreground">Sales demo workspace</p>
      </div>
    </div>
  );
}
