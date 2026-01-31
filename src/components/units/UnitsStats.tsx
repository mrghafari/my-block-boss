import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Home, UserCheck } from "lucide-react";
import { useUnits } from "@/hooks/useUnits";

export function UnitsStats() {
  const { data: units = [] } = useUnits();

  const stats = {
    total: units.length,
    occupied: units.filter((u) => u.is_occupied).length,
    vacant: units.filter((u) => !u.is_occupied).length,
    totalResidents: units.reduce((sum, u) => sum + (u.resident_count || 1), 0),
  };

  const statItems = [
    {
      title: "کل واحدها",
      value: stats.total,
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "واحدهای دارای ساکن",
      value: stats.occupied,
      icon: Home,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "واحدهای خالی",
      value: stats.vacant,
      icon: UserCheck,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "کل ساکنین",
      value: stats.totalResidents,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            variant="stats"
            className="animate-fade-in opacity-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {new Intl.NumberFormat("fa-IR").format(stat.value)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
