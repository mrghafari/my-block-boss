import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone as PhoneIcon, Star, Loader2 } from "lucide-react";

interface Props {
  buildingId: string;
}

export function ResidentContacts({ buildingId }: Props) {
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["resident_contacts", buildingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("building_contacts")
        .select("*")
        .eq("building_id", buildingId)
        .order("specialty", { ascending: true });
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

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <PhoneIcon className="w-12 h-12 mb-3 opacity-30" />
          <p>مخاطبی ثبت نشده است</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {contacts.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.specialty}</p>
                {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
              </div>
              {c.rating > 0 && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: c.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              )}
            </div>
            <a
              href={`tel:${c.phone}`}
              className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
              dir="ltr"
            >
              <PhoneIcon className="w-3.5 h-3.5" />
              {c.phone}
            </a>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
