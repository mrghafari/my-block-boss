import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, ShieldCheck, Home, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UnitMatch {
  unit_id: string | null;
  unit_number: string | null;
  building_id: string;
  building_name: string;
  owner_name?: string;
  resident_name?: string | null;
  role: "owner" | "resident" | "manager";
  isManager: boolean;
}

interface RoleSwitcherProps {
  variant?: "header" | "sidebar";
  compact?: boolean;
}

export function RoleSwitcher({ variant = "header", compact = false }: RoleSwitcherProps) {
  const [matches, setMatches] = useState<UnitMatch[]>([]);
  const [current, setCurrent] = useState<UnitMatch | null>(null);

  useEffect(() => {
    try {
      const all = JSON.parse(localStorage.getItem("resident_matches_all") || "[]") as UnitMatch[];
      const sel = JSON.parse(localStorage.getItem("resident_matches") || "[]") as UnitMatch[];
      setMatches(all);
      setCurrent(sel[0] || null);
    } catch {
      setMatches([]);
    }
  }, []);

  const managers = useMemo(() => matches.filter((m) => m.isManager), [matches]);
  const residents = useMemo(() => matches.filter((m) => !m.isManager), [matches]);

  if (matches.length < 2) return null;

  const isSame = (a: UnitMatch, b: UnitMatch | null) =>
    !!b && a.building_id === b.building_id && a.unit_id === b.unit_id && a.role === b.role;

  const switchTo = (m: UnitMatch) => {
    if (isSame(m, current)) return;
    localStorage.setItem("resident_matches", JSON.stringify([m]));
    localStorage.setItem("currentBuildingId", m.building_id);
    // Full reload so all contexts/queries reset
    window.location.href = m.isManager ? "/dashboard" : "/resident";
  };

  const label = current
    ? current.isManager
      ? `مدیر · ${current.building_name}`
      : `واحد ${current.unit_number} · ${current.role === "owner" ? "مالک" : "ساکن"}`
    : "تغییر نقش";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={variant === "sidebar" ? "w-full justify-between text-xs h-8" : "gap-2"}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">جابجایی بین نقش‌ها و ساختمان‌ها</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {managers.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground">🛡️ مدیریت</DropdownMenuLabel>
            {managers.map((m) => (
              <DropdownMenuItem
                key={`mgr-${m.building_id}`}
                onClick={() => switchTo(m)}
                className="cursor-pointer gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="flex-1 truncate">{m.building_name}</span>
                {isSame(m, current) && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
        {residents.length > 0 && (
          <>
            {managers.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[10px] text-muted-foreground">🏠 ساکن / مالک</DropdownMenuLabel>
            {residents.map((m) => (
              <DropdownMenuItem
                key={`res-${m.building_id}-${m.unit_id}-${m.role}`}
                onClick={() => switchTo(m)}
                className="cursor-pointer gap-2"
              >
                <Home className="w-4 h-4 text-accent" />
                <span className="flex-1 truncate">
                  {m.building_name} — واحد {m.unit_number} ({m.role === "owner" ? "مالک" : "ساکن"})
                </span>
                {isSame(m, current) && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
