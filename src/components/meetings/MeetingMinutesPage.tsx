import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBuilding } from "@/contexts/BuildingContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { formatJalaliDate } from "@/lib/jalaliDate";
import { toast } from "sonner";
import { FileText, Plus, Search, Download, Trash2, Pencil, Calendar, Loader2, Paperclip } from "lucide-react";

interface MeetingMinute {
  id: string;
  building_id: string;
  title: string;
  meeting_date: string;
  content: string | null;
  pdf_file_path: string | null;
  pdf_file_name: string | null;
  pdf_file_size: number;
  created_at: string;
}

interface Props {
  buildingId?: string;
  canEdit?: boolean;
}

export function MeetingMinutesPage({ buildingId: propBuildingId, canEdit = true }: Props) {
  const { currentBuildingId } = useBuilding();
  const buildingId = propBuildingId || currentBuildingId;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MeetingMinute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MeetingMinute | null>(null);

  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(new Date());
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: minutes = [], isLoading } = useQuery({
    queryKey: ["meeting_minutes", buildingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_meeting_minutes" as any)
        .select("*")
        .eq("building_id", buildingId!)
        .order("meeting_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MeetingMinute[];
    },
    enabled: !!buildingId,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return minutes;
    const q = search.trim().toLowerCase();
    return minutes.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.content || "").toLowerCase().includes(q)
    );
  }, [minutes, search]);

  const resetForm = () => {
    setTitle("");
    setMeetingDate(new Date());
    setContent("");
    setPdfFile(null);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (m: MeetingMinute) => {
    setEditing(m);
    setTitle(m.title);
    setMeetingDate(new Date(m.meeting_date));
    setContent(m.content || "");
    setPdfFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !meetingDate || !buildingId || !user) {
      toast.error("عنوان و تاریخ جلسه الزامی است");
      return;
    }
    if (pdfFile && pdfFile.type !== "application/pdf") {
      toast.error("فقط فایل PDF مجاز است");
      return;
    }
    if (pdfFile && pdfFile.size > 20 * 1024 * 1024) {
      toast.error("حجم فایل نباید بیش از ۲۰ مگابایت باشد");
      return;
    }

    setSubmitting(true);
    try {
      let pdf_file_path = editing?.pdf_file_path || null;
      let pdf_file_name = editing?.pdf_file_name || null;
      let pdf_file_size = editing?.pdf_file_size || 0;

      if (pdfFile) {
        const ext = pdfFile.name.split(".").pop() || "pdf";
        const path = `${buildingId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("meeting-minutes")
          .upload(path, pdfFile, { contentType: "application/pdf" });
        if (upErr) throw upErr;

        // Remove old file if replacing
        if (editing?.pdf_file_path) {
          await supabase.storage.from("meeting-minutes").remove([editing.pdf_file_path]);
        }
        pdf_file_path = path;
        pdf_file_name = pdfFile.name;
        pdf_file_size = pdfFile.size;
      }

      const payload = {
        building_id: buildingId,
        title: title.trim(),
        meeting_date: meetingDate.toISOString().split("T")[0],
        content: content.trim() || null,
        pdf_file_path,
        pdf_file_name,
        pdf_file_size,
      };

      if (editing) {
        const { error } = await supabase
          .from("building_meeting_minutes" as any)
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("صورتجلسه به‌روزرسانی شد");
      } else {
        const { error } = await supabase
          .from("building_meeting_minutes" as any)
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("صورتجلسه ثبت شد");
      }

      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["meeting_minutes", buildingId] });
    } catch (e: any) {
      toast.error(e.message || "خطا در ثبت صورتجلسه");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (m: MeetingMinute) => {
      if (m.pdf_file_path) {
        await supabase.storage.from("meeting-minutes").remove([m.pdf_file_path]);
      }
      const { error } = await supabase
        .from("building_meeting_minutes" as any)
        .delete()
        .eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("صورتجلسه حذف شد");
      queryClient.invalidateQueries({ queryKey: ["meeting_minutes", buildingId] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message || "خطا در حذف"),
  });

  const handleDownload = async (m: MeetingMinute) => {
    if (!m.pdf_file_path) return;
    const { data, error } = await supabase.storage
      .from("meeting-minutes")
      .createSignedUrl(m.pdf_file_path, 3600);
    if (error || !data?.signedUrl) {
      toast.error("خطا در دریافت فایل");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  // Highlight matched text
  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const parts = text.split(new RegExp(`(${q})`, "gi"));
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase()
        ? <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">{p}</mark>
        : <span key={i}>{p}</span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">صورتجلسات ساختمان</h1>
          <p className="text-muted-foreground text-sm mt-1">آرشیو، جستجو و دانلود صورتجلسات</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 ml-1" />
            صورتجلسه جدید
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در عنوان و متن صورتجلسات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p>{search ? "نتیجه‌ای یافت نشد" : "صورتجلسه‌ای ثبت نشده است"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1 flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span>{highlight(m.title, search)}</span>
                      {m.pdf_file_path && <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>تاریخ جلسه: {formatJalaliDate(m.meeting_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.pdf_file_path && (
                      <Button variant="outline" size="sm" onClick={() => handleDownload(m)}>
                        <Download className="w-3.5 h-3.5 ml-1" />
                        دانلود PDF
                      </Button>
                    )}
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(m)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              {m.content && (
                <CardContent className="pt-0">
                  <div className="text-sm whitespace-pre-wrap leading-7 bg-muted/30 rounded-md p-3 max-h-60 overflow-auto">
                    {highlight(m.content, search)}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "ویرایش صورتجلسه" : "ثبت صورتجلسه جدید"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان جلسه *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: جلسه عمومی هیئت‌مدیره" />
            </div>
            <div className="space-y-2">
              <Label>تاریخ جلسه *</Label>
              <JalaliDatePicker value={meetingDate} onChange={setMeetingDate} />
            </div>
            <div className="space-y-2">
              <Label>متن صورتجلسه (قابل جستجو)</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن کامل صورتجلسه را اینجا وارد کنید..."
                className="min-h-40"
              />
            </div>
            <div className="space-y-2">
              <Label>فایل PDF (اختیاری)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              {editing?.pdf_file_name && !pdfFile && (
                <p className="text-xs text-muted-foreground">فایل فعلی: {editing.pdf_file_name}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>انصراف</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-1" />}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف صورتجلسه</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{deleteTarget?.title}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
