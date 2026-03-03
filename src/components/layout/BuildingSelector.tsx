import { Building2, ChevronDown } from "lucide-react";
import { useBuilding } from "@/contexts/BuildingContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function BuildingSelector() {
  const { buildings, currentBuilding, setCurrentBuildingId, isLoading } = useBuilding();

  if (isLoading || buildings.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="truncate">{currentBuilding?.name || "انتخاب ساختمان"}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {buildings.map((building) => (
          <DropdownMenuItem
            key={building.id}
            onClick={() => setCurrentBuildingId(building.id)}
            className={building.id === currentBuilding?.id ? "bg-accent" : ""}
          >
            <Building2 className="w-4 h-4 ml-2" />
            {building.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
