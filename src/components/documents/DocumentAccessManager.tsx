import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck } from "lucide-react";
import { useUnits } from "@/hooks/useUnits";
import {
  useUnitDocumentAccessBlocks,
  useToggleUnitDocumentAccess,
  type DocAccessPersonType,
} from "@/hooks/useUnitDocumentAccess";
import { useBuilding } from "@/contexts/BuildingContext";

export function DocumentAccessManager() {
  const { currentBuildingId } = useBuilding();
  const { data: units = [] } = useUnits();
  const { data: blocks = [] } = useUnitDocumentAccessBlocks(currentBuildingId || undefined);
  const toggle = useToggleUnitDocumentAccess();
  const [search, setSearch] = useState("");

  // Map: unitId -> Set of blocked person_types
  const blockMap = useMemo(() => {
    const m = new Map<string, Set<DocAccessPersonType>>();
    blocks.forEach(b => {
      if (!m.has(b.unit_id)) m.set(b.unit_id, new Set());
      m.get(b.unit_id)!.add(b.person_type);
    });
    return m;
  }, [blocks]);

  const isBlocked = (unitId: string, person: DocAccessPersonType) => {
    const set = blockMap.get(unitId);
    if (!set) return false;
    return set.has(person) || set.has("both");
  };

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return units;
    return units.filter(u =>
      u.unit_number.includes(q) ||
      (u.owner_name || "").includes(q) ||
      (u.resident_name || "").includes(q)
    );
  }, [units, search]);

  const handleToggle = (unitId: string, person: DocAccessPersonType, currentlyAllowed: boolean) => {
    if (!currentBuildingId) return;
    toggle.mutate({
      buildingId: currentBuildingId,
      unitId,
      personType: person,
      blocked: currentlyAllowed, // turning switch OFF = block
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          مدیریت دسترسی واحدها به اسناد
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          به صورت پیش‌فرض همه واحدها به اسناد دسترسی دارند. می‌توانید دسترسی مالک یا ساکن هر واحد را به‌صورت جداگانه فعال یا غیرفعال کنید.
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو بر اساس شماره واحد، نام مالک یا ساکن..."
            className="pr-9"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map(u => {
            const ownerBlocked = isBlocked(u.id, "owner");
            const residentBlocked = isBlocked(u.id, "resident");
            return (
              <div
                key={u.id}
                className="p-3 rounded-lg border bg-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">واحد {u.unit_number}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">مالک</div>
                    <div className="truncate">{u.owner_name || "—"}</div>
                  </div>
                  <Switch
                    checked={!ownerBlocked}
                    onCheckedChange={() => handleToggle(u.id, "owner", !ownerBlocked)}
                    disabled={toggle.isPending}
                  />
                </div>

                <div className="flex items-center justify-between text-sm border-t pt-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground">ساکن</div>
                    <div className="truncate">{u.resident_name || "—"}</div>
                  </div>
                  <Switch
                    checked={!residentBlocked}
                    onCheckedChange={() => handleToggle(u.id, "resident", !residentBlocked)}
                    disabled={toggle.isPending}
                  />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground py-6">واحدی یافت نشد</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
