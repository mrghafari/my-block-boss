import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { UnitForm } from "./UnitForm";
import { UnitsList } from "./UnitsList";
import { UnitsStats } from "./UnitsStats";
import type { Unit } from "@/hooks/useUnits";

export function UnitsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);

  const handleEdit = (unit: Unit) => {
    setEditUnit(unit);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditUnit(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="w-7 h-7 text-primary" />
            مدیریت واحدها
          </h1>
          <p className="text-muted-foreground mt-1">
            ثبت و مدیریت اطلاعات واحدهای ساختمان
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            ثبت واحد جدید
          </Button>
        )}
      </div>

      {/* Stats */}
      <UnitsStats />

      {/* Add/Edit Unit Form */}
      {showForm && (
        <UnitForm onClose={handleClose} editUnit={editUnit} />
      )}

      {/* Units List */}
      <UnitsList onEdit={handleEdit} />
    </div>
  );
}
