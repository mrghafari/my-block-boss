import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, LogIn, UserCog, Search, Check } from "lucide-react";
import { useAdminBuildings, useReassignBuildingManager, useAdminLookupUser, type AdminLookupUser } from "@/hooks/useAdmin";

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("fa-IR"); } catch { return d; }
}

export function AdminBuildings() {
  const navigate = useNavigate();
  const { data: buildings, isLoading } = useAdminBuildings();
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminLookupUser | null>(null);
  const { data: lookupResults, isFetching: lookingUp } = useAdminLookupUser(query);
  const reassign = useReassignBuildingManager();

  const closeAssign = () => {
    setAssignTarget(null);
    setQuery("");
    setSelected(null);
  };

  const handleAssign = () => {
    if (!assignTarget || !selected) return;
    reassign.mutate(
      { buildingId: assignTarget.id, newUserId: selected.user_id },
      { onSuccess: closeAssign }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            لیست ساختمان‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !buildings?.length ? (
            <p className="text-center text-muted-foreground py-10">هنوز ساختمانی ثبت نشده است</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام ساختمان</TableHead>
                    <TableHead>آدرس</TableHead>
                    <TableHead>واحدها</TableHead>
                    <TableHead>نام مدیر</TableHead>
                    <TableHead>موبایل مدیر</TableHead>
                    <TableHead>ایمیل مدیر</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{b.address || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{b.total_units.toLocaleString("fa-IR")}</Badge></TableCell>
                      <TableCell>
                        {b.manager_name || <span className="text-destructive text-xs">بدون مدیر</span>}
                      </TableCell>
                      <TableCell className="text-xs ltr">{b.manager_phone || "—"}</TableCell>
                      <TableCell className="text-xs ltr">{b.manager_email || "—"}</TableCell>
                      <TableCell>{formatDate(b.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="default" className="gap-1" onClick={() => navigate(`/admin/building/${b.id}`)}>
                            <LogIn className="h-4 w-4" />
                            ورود
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setAssignTarget({ id: b.id, name: b.name })}>
                            <UserCog className="h-4 w-4" />
                            انتساب مدیر
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && closeAssign()}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle>انتساب مدیر ساختمان: {assignTarget?.name}</DialogTitle>
            <DialogDescription>
              کاربر مورد نظر را با شماره موبایل، ایمیل یا نام جستجو کنید. مدیر فعلی فقط پس از ثبت موفق مدیر جدید جایگزین می‌شود.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>جستجوی کاربر</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="موبایل، ایمیل یا نام (حداقل ۳ حرف)"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                  className="pr-10"
                />
              </div>
            </div>

            <div className="border rounded-md max-h-64 overflow-y-auto">
              {query.length < 3 ? (
                <p className="text-xs text-muted-foreground text-center py-6">حداقل ۳ حرف وارد کنید</p>
              ) : lookingUp ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : !lookupResults?.length ? (
                <p className="text-xs text-muted-foreground text-center py-6">کاربری یافت نشد</p>
              ) : (
                <ul className="divide-y">
                  {lookupResults.map((u) => (
                    <li
                      key={u.user_id}
                      className={`px-3 py-2 cursor-pointer hover:bg-muted flex items-center justify-between ${selected?.user_id === u.user_id ? "bg-muted" : ""}`}
                      onClick={() => setSelected(u)}
                    >
                      <div className="text-sm">
                        <div className="font-medium">{u.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground ltr">{u.phone || "—"} • {u.email}</div>
                      </div>
                      {selected?.user_id === u.user_id && <Check className="h-4 w-4 text-primary" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAssign}>انصراف</Button>
            <Button onClick={handleAssign} disabled={!selected || reassign.isPending}>
              {reassign.isPending ? "در حال انتساب..." : "ثبت به‌عنوان مدیر"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
