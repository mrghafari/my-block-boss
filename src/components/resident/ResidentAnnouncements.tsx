import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Bell, Loader2 } from "lucide-react";
import { formatJalaliDate } from "@/lib/jalaliDate";

interface Props {
  buildingId: string;
}

export function ResidentAnnouncements({ buildingId }: Props) {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["resident_announcements", buildingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_announcements")
        .select("*")
        .eq("building_id", buildingId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Bell className="w-12 h-12 mb-3 opacity-30" />
          <p>اطلاعیه‌ای ثبت نشده است</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a) => (
        <Card key={a.id} className={a.is_pinned ? "border-primary/30 bg-primary/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {a.is_pinned && <Pin className="w-3.5 h-3.5 text-primary rotate-45" />}
              {a.title}
              {a.is_pinned && <Badge variant="secondary" className="text-xs">سنجاق‌شده</Badge>}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{formatJalaliDate(a.created_at)}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{a.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
