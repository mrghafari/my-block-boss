import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Eye, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AttachmentsQuickDialogProps {
  expenseId: string | null;
  expenseTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatSize = (bytes: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export function AttachmentsQuickDialog({
  expenseId,
  expenseTitle,
  open,
  onOpenChange,
}: AttachmentsQuickDialogProps) {
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["expense_attachments", expenseId],
    queryFn: async () => {
      if (!expenseId) return [];
      const { data, error } = await supabase
        .from("expense_attachments")
        .select("*")
        .eq("expense_id", expenseId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!expenseId && open,
  });

  const getSignedUrl = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("expense-attachments")
      .createSignedUrl(filePath, 60 * 5);
    if (error || !data?.signedUrl) {
      toast({ title: "خطا", description: "ایجاد لینک دانلود ناموفق بود", variant: "destructive" });
      return null;
    }
    return data.signedUrl;
  };

  const handleView = async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getSignedUrl(filePath);
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Paperclip className="w-5 h-5 text-primary" />
            مستندات پیوست
            {expenseTitle && (
              <span className="text-sm text-muted-foreground font-normal">
                — {expenseTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>هیچ پیوستی برای این هزینه ثبت نشده است</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between gap-2 p-3 rounded-md border bg-muted/30"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" title={att.file_name}>
                      {att.file_name}
                    </p>
                    {att.file_size > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formatSize(att.file_size)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary"
                    title="مشاهده"
                    onClick={() => handleView(att.file_path)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary"
                    title="دانلود"
                    onClick={() => handleDownload(att.file_path, att.file_name)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
