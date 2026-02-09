import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useUnits } from "@/hooks/useUnits";
import { useCreateManager, useUpdateManager, Manager } from "@/hooks/useManagers";
import { toJalaliString, fromJalaliString, getTodayJalali } from "@/lib/jalaliDate";

const formSchema = z.object({
  unit_id: z.string().min(1, "واحد را انتخاب کنید"),
  role_type: z.enum(["owner", "resident"]),
  mobile: z.string().optional(),
  email: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  start_date: z.string().min(1, "تاریخ شروع را وارد کنید"),
  end_date: z.string().optional(),
  charge_discount_percent: z.number().min(0).max(100),
  extra_charge_discount_percent: z.number().min(0).max(100),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManagerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: Manager | null;
}

export function ManagerFormDialog({ open, onOpenChange, manager }: ManagerFormDialogProps) {
  const { data: units = [] } = useUnits();
  const createManager = useCreateManager();
  const updateManager = useUpdateManager();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unit_id: "",
      role_type: "owner",
      mobile: "",
      email: "",
      start_date: getTodayJalali(),
      end_date: "",
      charge_discount_percent: 0,
      extra_charge_discount_percent: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (manager) {
      form.reset({
        unit_id: manager.unit_id,
        role_type: manager.role_type,
        mobile: manager.mobile || "",
        email: manager.email || "",
        start_date: toJalaliString(new Date(manager.start_date)),
        end_date: manager.end_date ? toJalaliString(new Date(manager.end_date)) : "",
        charge_discount_percent: manager.charge_discount_percent,
        extra_charge_discount_percent: manager.extra_charge_discount_percent,
        is_active: manager.is_active,
      });
    } else {
      form.reset({
        unit_id: "",
        role_type: "owner",
        mobile: "",
        email: "",
        start_date: getTodayJalali(),
        end_date: "",
        charge_discount_percent: 0,
        extra_charge_discount_percent: 0,
        is_active: true,
      });
    }
  }, [manager, form, open]);

  const selectedUnit = units.find((u) => u.id === form.watch("unit_id"));
  const roleType = form.watch("role_type");

  const onSubmit = (values: FormValues) => {
    const data = {
      unit_id: values.unit_id,
      role_type: values.role_type,
      mobile: values.mobile || undefined,
      email: values.email || undefined,
      start_date: fromJalaliString(values.start_date),
      end_date: values.end_date ? fromJalaliString(values.end_date) : undefined,
      charge_discount_percent: values.charge_discount_percent,
      extra_charge_discount_percent: values.extra_charge_discount_percent,
      is_active: values.is_active,
    };

    if (manager) {
      updateManager.mutate({ id: manager.id, ...data }, {
        onSuccess: () => onOpenChange(false),
      });
    } else {
      createManager.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createManager.isPending || updateManager.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{manager ? "ویرایش مدیر" : "افزودن مدیر"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>واحد</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="واحد را انتخاب کنید" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          پلاک {unit.unit_number} - {unit.owner_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نقش</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owner">مالک</SelectItem>
                      <SelectItem value="resident">ساکن</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedUnit && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-1">اطلاعات از سیستم:</div>
                <div className="text-muted-foreground">
                  {roleType === "owner" ? (
                    <>
                      نام: {selectedUnit.owner_name}
                      {selectedUnit.phone && ` | تلفن: ${selectedUnit.phone}`}
                    </>
                  ) : (
                    <>
                      نام: {selectedUnit.resident_name || selectedUnit.owner_name}
                      {(selectedUnit.resident_phone || selectedUnit.phone) && 
                        ` | تلفن: ${selectedUnit.resident_phone || selectedUnit.phone}`}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>موبایل</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="09123456789" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ایمیل</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@example.com" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ شروع</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1403/01/01" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ پایان (اختیاری)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1404/01/01" dir="ltr" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="charge_discount_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    تخفیف شارژ: {field.value}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="extra_charge_discount_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    تخفیف شارژ اضافی: {field.value}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>فعال</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {manager ? "به‌روزرسانی" : "ثبت مدیر"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
