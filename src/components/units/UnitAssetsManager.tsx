import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Warehouse, Car, Loader2, Pencil, Check, X } from "lucide-react";
import {
  useUnitStorages,
  useUnitVehicles,
  useCreateUnitStorage,
  useDeleteUnitStorage,
  useUpdateUnitStorage,
  useCreateUnitVehicle,
  useDeleteUnitVehicle,
  useUpdateUnitVehicle,
  IRAN_PLATE_LETTERS,
  type UnitStorage,
  type UnitVehicle,
} from "@/hooks/useUnitAssets";

interface Props {
  unitId: string;
}

const normalizeDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^0-9]/g, "");

export function UnitAssetsManager({ unitId }: Props) {
  const { data: storages = [], isLoading: loadingS } = useUnitStorages(unitId);
  const { data: vehicles = [], isLoading: loadingV } = useUnitVehicles(unitId);
  const createStorage = useCreateUnitStorage();
  const deleteStorage = useDeleteUnitStorage();
  const updateStorage = useUpdateUnitStorage();
  const createVehicle = useCreateUnitVehicle();
  const deleteVehicle = useDeleteUnitVehicle();
  const updateVehicle = useUpdateUnitVehicle();

  const [storageNumber, setStorageNumber] = useState("");
  const [storageDesc, setStorageDesc] = useState("");

  const [p1, setP1] = useState("");
  const [letter, setLetter] = useState("");
  const [p2, setP2] = useState("");
  const [city, setCity] = useState("");
  const [vDesc, setVDesc] = useState("");

  // Edit state
  const [editingStorageId, setEditingStorageId] = useState<string | null>(null);
  const [editStorage, setEditStorage] = useState<{ storage_number: string; description: string }>({ storage_number: "", description: "" });
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editVehicle, setEditVehicle] = useState<{ p1: string; letter: string; p2: string; city: string; description: string }>({
    p1: "", letter: "", p2: "", city: "", description: "",
  });

  const addStorage = () => {
    if (!storageNumber.trim()) return;
    createStorage.mutate(
      { unit_id: unitId, storage_number: storageNumber.trim(), description: storageDesc.trim() || null },
      { onSuccess: () => { setStorageNumber(""); setStorageDesc(""); } },
    );
  };

  const addVehicle = () => {
    if (p1.length !== 2 || !letter || p2.length !== 3 || city.length !== 2) return;
    createVehicle.mutate(
      { unit_id: unitId, plate_part1: p1, plate_letter: letter, plate_part2: p2, plate_city: city, description: vDesc.trim() || null },
      { onSuccess: () => { setP1(""); setLetter(""); setP2(""); setCity(""); setVDesc(""); } },
    );
  };

  const startEditStorage = (s: UnitStorage) => {
    setEditingStorageId(s.id);
    setEditStorage({ storage_number: s.storage_number, description: s.description || "" });
  };

  const saveEditStorage = () => {
    if (!editingStorageId || !editStorage.storage_number.trim()) return;
    updateStorage.mutate(
      { id: editingStorageId, unit_id: unitId, storage_number: editStorage.storage_number.trim(), description: editStorage.description.trim() || null },
      { onSuccess: () => setEditingStorageId(null) },
    );
  };

  const startEditVehicle = (v: UnitVehicle) => {
    setEditingVehicleId(v.id);
    setEditVehicle({ p1: v.plate_part1, letter: v.plate_letter, p2: v.plate_part2, city: v.plate_city, description: v.description || "" });
  };

  const saveEditVehicle = () => {
    if (!editingVehicleId) return;
    const { p1, letter, p2, city, description } = editVehicle;
    if (p1.length !== 2 || !letter || p2.length !== 3 || city.length !== 2) return;
    updateVehicle.mutate(
      { id: editingVehicleId, unit_id: unitId, plate_part1: p1, plate_letter: letter, plate_part2: p2, plate_city: city, description: description.trim() || null },
      { onSuccess: () => setEditingVehicleId(null) },
    );
  };

  return (
    <div className="space-y-6">
      {/* Storages */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Warehouse className="w-4 h-4" />
          انبارها
        </h3>
        <Card className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] items-end">
            <div className="space-y-2">
              <Label>شماره انبار *</Label>
              <Input value={storageNumber} onChange={(e) => setStorageNumber(e.target.value)} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Input value={storageDesc} onChange={(e) => setStorageDesc(e.target.value)} maxLength={150} />
            </div>
            <Button type="button" onClick={addStorage} disabled={createStorage.isPending} className="gap-2">
              {createStorage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              افزودن
            </Button>
          </div>

          {loadingS ? (
            <div className="text-center py-4 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
          ) : storages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">انباری ثبت نشده است</p>
          ) : (
            <div className="space-y-2">
              {storages.map((s) => (
                <div key={s.id} className="p-3 bg-muted/40 rounded-md">
                  {editingStorageId === s.id ? (
                    <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">شماره</Label>
                        <Input value={editStorage.storage_number} onChange={(e) => setEditStorage((p) => ({ ...p, storage_number: e.target.value }))} maxLength={20} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">توضیحات</Label>
                        <Input value={editStorage.description} onChange={(e) => setEditStorage((p) => ({ ...p, description: e.target.value }))} maxLength={150} />
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="icon" onClick={saveEditStorage} disabled={updateStorage.isPending}>
                          {updateStorage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setEditingStorageId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Warehouse className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">انبار شماره {s.storage_number}</div>
                          {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => startEditStorage(s)}>
                          <Pencil className="w-4 h-4 text-primary" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => deleteStorage.mutate(s)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Vehicles */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Car className="w-4 h-4" />
          خودروها
        </h3>
        <Card className="p-4 space-y-3">
          <div className="space-y-2">
            <Label>پلاک خودرو (الگوی ایران)</Label>
            <div dir="ltr" style={{ unicodeBidi: "isolate", flexDirection: "row" }} className="flex items-stretch gap-1 justify-center bg-background border-2 border-foreground/30 rounded-md p-2 max-w-md mx-auto">
              <Input dir="ltr" value={p1} onChange={(e) => setP1(normalizeDigits(e.target.value).slice(0, 2))} placeholder="12" className="w-14 text-center font-bold text-lg" maxLength={2} />
              <Select value={letter} onValueChange={setLetter}>
                <SelectTrigger className="w-20 font-bold text-lg"><SelectValue placeholder="ب" /></SelectTrigger>
                <SelectContent>
                  {IRAN_PLATE_LETTERS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input dir="ltr" value={p2} onChange={(e) => setP2(normalizeDigits(e.target.value).slice(0, 3))} placeholder="345" className="w-20 text-center font-bold text-lg" maxLength={3} />
              <div className="flex flex-col items-center justify-center px-2 bg-primary text-primary-foreground rounded">
                <span className="text-[10px]">ایران</span>
                <Input dir="ltr" value={city} onChange={(e) => setCity(normalizeDigits(e.target.value).slice(0, 2))} placeholder="67" className="w-12 h-6 text-center font-bold p-0 bg-background text-foreground" maxLength={2} />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
            <div className="space-y-2">
              <Label>توضیحات (مدل/رنگ)</Label>
              <Input value={vDesc} onChange={(e) => setVDesc(e.target.value)} maxLength={150} />
            </div>
            <Button type="button" onClick={addVehicle} disabled={createVehicle.isPending} className="gap-2">
              {createVehicle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              افزودن خودرو
            </Button>
          </div>

          {loadingV ? (
            <div className="text-center py-4 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">خودرویی ثبت نشده است</p>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <div key={v.id} className="p-3 bg-muted/40 rounded-md">
                  {editingVehicleId === v.id ? (
                    <div className="space-y-3">
                      <div dir="ltr" style={{ unicodeBidi: "isolate" }} className="flex items-stretch gap-1 justify-center bg-background border-2 border-foreground/30 rounded-md p-2 max-w-md mx-auto">
                        <Input dir="ltr" value={editVehicle.p1} onChange={(e) => setEditVehicle((p) => ({ ...p, p1: normalizeDigits(e.target.value).slice(0, 2) }))} className="w-14 text-center font-bold text-lg" maxLength={2} />
                        <Select value={editVehicle.letter} onValueChange={(v) => setEditVehicle((p) => ({ ...p, letter: v }))}>
                          <SelectTrigger className="w-20 font-bold text-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {IRAN_PLATE_LETTERS.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <Input dir="ltr" value={editVehicle.p2} onChange={(e) => setEditVehicle((p) => ({ ...p, p2: normalizeDigits(e.target.value).slice(0, 3) }))} className="w-20 text-center font-bold text-lg" maxLength={3} />
                        <div className="flex flex-col items-center justify-center px-2 bg-primary text-primary-foreground rounded">
                          <span className="text-[10px]">ایران</span>
                          <Input dir="ltr" value={editVehicle.city} onChange={(e) => setEditVehicle((p) => ({ ...p, city: normalizeDigits(e.target.value).slice(0, 2) }))} className="w-12 h-6 text-center font-bold p-0 bg-background text-foreground" maxLength={2} />
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">توضیحات</Label>
                          <Input value={editVehicle.description} onChange={(e) => setEditVehicle((p) => ({ ...p, description: e.target.value }))} maxLength={150} />
                        </div>
                        <div className="flex gap-1">
                          <Button type="button" size="icon" onClick={saveEditVehicle} disabled={updateVehicle.isPending}>
                            {updateVehicle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button type="button" size="icon" variant="ghost" onClick={() => setEditingVehicleId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Car className="w-4 h-4 text-primary" />
                        <div>
                          <div dir="ltr" style={{ unicodeBidi: "isolate" }} className="font-mono font-bold tracking-wider inline-flex gap-2 items-center">
                            <span>{v.plate_part1}</span>
                            <span>{v.plate_letter}</span>
                            <span>{v.plate_part2}</span>
                            <span>-</span>
                            <span>{v.plate_city}</span>
                          </div>
                          {v.description && <div className="text-xs text-muted-foreground">{v.description}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => startEditVehicle(v)}>
                          <Pencil className="w-4 h-4 text-primary" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => deleteVehicle.mutate(v)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
