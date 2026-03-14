import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ResidentMatch {
  unit_id: string;
  unit_number: string;
  building_id: string;
  building_name: string;
  owner_name: string;
  resident_name: string | null;
  role: "owner" | "resident";
  isManager: boolean;
}

export function useResidentUnit() {
  const { user } = useAuth();

  // Get from localStorage (set during auth)
  const storedMatches = useMemo(() => {
    try {
      const raw = localStorage.getItem("resident_matches");
      return raw ? (JSON.parse(raw) as ResidentMatch[]) : [];
    } catch {
      return [];
    }
  }, []);

  // Also query building_members to get unit associations
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["resident_memberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("building_members")
        .select("building_id, unit_id, role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get building details
  const buildingIds = memberships.map((m) => m.building_id);
  const { data: buildings = [] } = useQuery({
    queryKey: ["resident_buildings", buildingIds],
    queryFn: async () => {
      if (buildingIds.length === 0) return [];
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name, address")
        .in("id", buildingIds);
      if (error) throw error;
      return data || [];
    },
    enabled: buildingIds.length > 0,
  });

  // Get unit details
  const unitIds = memberships.filter((m) => m.unit_id).map((m) => m.unit_id!);
  const { data: units = [] } = useQuery({
    queryKey: ["resident_units", unitIds],
    queryFn: async () => {
      if (unitIds.length === 0) return [];
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .in("id", unitIds);
      if (error) throw error;
      return data || [];
    },
    enabled: unitIds.length > 0,
  });

  const currentMatch = storedMatches[0] || null;
  const currentBuildingId = currentMatch?.building_id || memberships[0]?.building_id || null;
  const currentUnitId = currentMatch?.unit_id || memberships[0]?.unit_id || null;
  const currentBuilding = buildings.find((b) => b.id === currentBuildingId);
  const currentUnit = units.find((u) => u.id === currentUnitId);

  return {
    matches: storedMatches,
    memberships,
    buildings,
    units,
    currentBuildingId,
    currentUnitId,
    currentBuilding,
    currentUnit,
    isLoading,
  };
}
