import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBuilding } from "@/contexts/BuildingContext";
import { useToast } from "@/hooks/use-toast";

export interface ReservationVenue {
  id: string;
  building_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Reservation {
  id: string;
  building_id: string;
  venue_id: string;
  unit_id: string | null;
  requester_user_id: string | null;
  requester_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  manager_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useReservationVenues(buildingId?: string) {
  const { currentBuildingId } = useBuilding();
  const bId = buildingId || currentBuildingId;
  return useQuery({
    queryKey: ["reservation_venues", bId],
    queryFn: async () => {
      if (!bId) return [];
      const { data, error } = await supabase
        .from("reservation_venues" as any)
        .select("*")
        .eq("building_id", bId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ReservationVenue[];
    },
    enabled: !!bId,
  });
}

export function useCreateReservationVenue() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (v: Omit<ReservationVenue, "id" | "created_at">) => {
      const { error } = await supabase.from("reservation_venues" as any).insert(v as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservation_venues"] });
      toast({ title: "موفق", description: "مکان اضافه شد" });
    },
    onError: (e: any) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteReservationVenue() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservation_venues" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservation_venues"] });
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast({ title: "موفق", description: "مکان حذف شد" });
    },
    onError: (e: any) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useReservations(buildingId?: string) {
  const { currentBuildingId } = useBuilding();
  const bId = buildingId || currentBuildingId;
  return useQuery({
    queryKey: ["reservations", bId],
    queryFn: async () => {
      if (!bId) return [];
      const { data, error } = await supabase
        .from("reservations" as any)
        .select("*")
        .eq("building_id", bId)
        .order("reservation_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Reservation[];
    },
    enabled: !!bId,
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (r: Omit<Reservation, "id" | "created_at" | "status" | "manager_note" | "reviewed_by" | "reviewed_at">) => {
      const { error } = await supabase.from("reservations" as any).insert(r as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast({ title: "موفق", description: "درخواست رزرو ثبت شد و در انتظار تایید مدیر است" });
    },
    onError: (e: any) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateReservationStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status, manager_note }: { id: string; status: "approved" | "rejected"; manager_note?: string }) => {
      const { error } = await supabase
        .from("reservations" as any)
        .update({ status, manager_note: manager_note || null, reviewed_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast({ title: "موفق", description: vars.status === "approved" ? "رزرو تایید شد" : "رزرو رد شد" });
    },
    onError: (e: any) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteReservation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservations"] });
      toast({ title: "موفق", description: "رزرو حذف شد" });
    },
    onError: (e: any) => toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}
