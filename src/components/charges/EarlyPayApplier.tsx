import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BadgePercent, Loader2, Calculator } from "lucide-react";
import { usePaymentPolicy } from "@/hooks/usePaymentPolicy";
import { useUnits } from "@/hooks/useUnits";
import { usePayments } from "@/hooks/usePayments";
import { useBuilding } from "@/contexts/BuildingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const fmt = (n: number) => Math.round(Math.abs(n)).toLocaleString("fa-IR");

const isDiscountDescription = (d?: string | null) =>
  !!d && d.startsWith("تخفیف خوش‌حسابی");

export function EarlyPayApplier() {
  const { data: policy, isLoading: policyLoading } = usePaymentPolicy();
  const { data: units = [] } = useUnits();
  const { data: payments = [] } = usePayments();
  const { currentBuildingId } = useBuilding();
  const qc = useQueryClient();

  const now = new Date();
  const [month, setMonth] = useState(String(Number(format(now, "M", { locale: faIR }))));
  const [year, setYear] = useState(String(Number(format(now, "yyyy", { locale: faIR }))));
  const [submitting, setSubmitting] = useState(false);

  // Candidates: units whose payments in this jalali month fall on/before early_pay_days
  const candidates = useMemo(() => {
    if (!policy?.early_pay_enabled || policy.early_pay_discount_percent <= 0) return [];
    const m = Number(month);
    const y = Number(year);
    const dayLimit = Math.max(1, policy.early_pay_days || 1);
    const discountPct = policy.early_pay_discount_percent;

    // Sum eligible payments per unit (within month, day<=dayLimit, fund_type=charge)
    const eligible = new Map<string, number>();
    for (const p of payments as any[]) {
      if (!p.payment_date) continue;
      const d = new Date(p.payment_date);
      const jMonth = Number(format(d, "M", { locale: faIR }));
      const jYear = Number(format(d, "yyyy", { locale: faIR }));
      const jDay = Number(format(d, "d", { locale: faIR }));
      if (jMonth !== m || jYear !== y) continue;
      if (jDay > dayLimit) continue;
      eligible.set(p.unit_id, (eligible.get(p.unit_id) || 0) + Number(p.amount || 0));
    }

    return units
      .map((u: any) => {
        const paid = eligible.get(u.id) || 0;
        const discount = Math.round((paid * discountPct) / 100);
        // Check existing discount payment record for this period
        const alreadyApplied = (payments as any[]).some(
          (p) => p.unit_id === u.id && p.month === m && p.year === y && isDiscountDescription(p.description)
        );
        return { unit: u, paid, discount, alreadyApplied };
      })
      .filter((c) => c.discount > 0);
  }, [units, payments, policy, month, year]);

  const newOnes = candidates.filter((c) => !c.alreadyApplied);
  const totalDiscount = newOnes.reduce((s, c) => s + c.discount, 0);

  const handleApply = async () => {
    if (!currentBuildingId || newOnes.length === 0) return;
    setSubmitting(true);
    try {
      // Record discounts as credit "payments" (extra income on charge fund)
      const todayIso = new Date().toISOString().slice(0, 10);
      const records = newOnes.map((c) => ({
        building_id: currentBuildingId,
        unit_id: c.unit.id,
        amount: c.discount,
        fund_type: "charge" as const,
        month: Number(month),
        year: Number(year),
        payment_date: todayIso,
        description: `تخفیف خوش‌حسابی ${persianMonths[Number(month) - 1]} ${year}`,
        owner_name: c.unit.owner_name || null,
        resident_name: c.unit.resident_name || null,
      }));
      const { error } = await supabase.from("payments").insert(records);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast({
        title: "تخفیف‌ها اعمال شد",
        description: `${records.length} رکورد تخفیف به مبلغ کل ${fmt(totalDiscount)} ریال ثبت شد.`,
      });
    } catch (e: any) {
      toast({ title: "خطا در اعمال تخفیف", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (policyLoading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </CardContent></Card>
    );
  }

  if (!policy?.early_pay_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgePercent className="w-5 h-5 text-muted-foreground" />
            اعمال تخفیف خوش‌حسابی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            تخفیف خوش‌حسابی در تنظیمات فعال نیست. ابتدا از بخش «تنظیمات → خوش‌حسابی و جریمه» آن را فعال کنید.
          </p>
        </CardContent>
      </Card>
    );
  }

  const years = Array.from({ length: 9 }, (_, i) => 1402 + i);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BadgePercent className="w-5 h-5 text-emerald-600" />
          اعمال تخفیف خوش‌حسابی
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          فرمول: مجموع پرداخت‌های هر واحد در ماه انتخاب‌شده تا روز <strong>{policy.early_pay_days.toLocaleString("fa-IR")}</strong> × <strong>{policy.early_pay_discount_percent}٪</strong> — به‌صورت بستانکاری ثبت می‌شود.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ماه</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {persianMonths.map((m, i) => (<SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">سال</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">واحدهای واجد شرایط:</span>
            <span className="font-medium">{candidates.length.toLocaleString("fa-IR")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">قبلاً تخفیف ثبت شده:</span>
            <span className="font-medium">{(candidates.length - newOnes.length).toLocaleString("fa-IR")}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">جدید برای اعمال:</span>
            <span className="font-bold text-emerald-700">{newOnes.length.toLocaleString("fa-IR")} واحد</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">جمع تخفیف‌های جدید:</span>
            <span className="font-bold text-emerald-700">{fmt(totalDiscount)} ریال</span>
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-right px-3 py-2">واحد</th>
                    <th className="text-right px-3 py-2">مالک/ساکن</th>
                    <th className="text-right px-3 py-2">پرداخت واجد شرایط</th>
                    <th className="text-right px-3 py-2">تخفیف</th>
                    <th className="text-right px-3 py-2">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.unit.id} className="border-t">
                      <td className="px-3 py-2">{c.unit.unit_number}</td>
                      <td className="px-3 py-2">{c.unit.resident_name || c.unit.owner_name}</td>
                      <td className="px-3 py-2">{fmt(c.paid)}</td>
                      <td className="px-3 py-2 text-emerald-700 font-medium">{fmt(c.discount)}</td>
                      <td className="px-3 py-2 text-xs">
                        {c.alreadyApplied ? <span className="text-muted-foreground">ثبت شده</span> : <span className="text-emerald-700">جدید</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {newOnes.length > 0 && (
          <div className="flex items-center justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={submitting} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  اعمال تخفیف برای {newOnes.length.toLocaleString("fa-IR")} واحد
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>تأیید اعمال تخفیف</AlertDialogTitle>
                  <AlertDialogDescription>
                    مجموع {fmt(totalDiscount)} ریال تخفیف خوش‌حسابی برای {newOnes.length.toLocaleString("fa-IR")} واحد در دوره {persianMonths[Number(month) - 1]} {year} به‌صورت بستانکاری ثبت می‌شود.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleApply}>تأیید و ثبت</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
