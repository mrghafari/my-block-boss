import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, LogOut, Wallet, Bell, BarChart3, FileText, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useResidentUnit } from "@/hooks/useResidentUnit";
import { ResidentFinance } from "@/components/resident/ResidentFinance";
import { ResidentAnnouncements } from "@/components/resident/ResidentAnnouncements";
import { ResidentPolls } from "@/components/resident/ResidentPolls";
import { ResidentDocuments } from "@/components/resident/ResidentDocuments";
import { ResidentContacts } from "@/components/resident/ResidentContacts";
import { Loader2 } from "lucide-react";

const ResidentDashboard = () => {
  const [activeTab, setActiveTab] = useState("finance");
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const {
    currentBuilding,
    currentUnit,
    currentBuildingId,
    currentUnitId,
    isLoading,
    matches,
  } = useResidentUnit();

  const handleSignOut = async () => {
    localStorage.removeItem("resident_matches");
    await signOut();
    navigate("/resident-auth", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!currentBuildingId || !currentUnitId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">اطلاعات واحد شما یافت نشد</p>
          <Button onClick={handleSignOut}>بازگشت</Button>
        </div>
      </div>
    );
  }

  const currentMatch = matches[0];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">{currentBuilding?.name || "ساختمان"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                واحد {currentUnit?.unit_number} • {currentMatch?.role === "owner" ? "مالک" : "ساکن"}: {currentMatch?.role === "owner" ? currentUnit?.owner_name : (currentUnit?.resident_name || currentUnit?.owner_name)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-muted-foreground">
            <LogOut className="w-4 h-4" />
            خروج
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="finance" className="gap-1.5 text-xs sm:text-sm">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">مالی</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-1.5 text-xs sm:text-sm">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">اطلاعیه‌ها</span>
            </TabsTrigger>
            <TabsTrigger value="polls" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">نظرسنجی</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">اسناد</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-1.5 text-xs sm:text-sm">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">دفترچه</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="finance" className="mt-4">
            <ResidentFinance buildingId={currentBuildingId} unitId={currentUnitId} />
          </TabsContent>
          <TabsContent value="announcements" className="mt-4">
            <ResidentAnnouncements buildingId={currentBuildingId} />
          </TabsContent>
          <TabsContent value="polls" className="mt-4">
            <ResidentPolls buildingId={currentBuildingId} />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <ResidentDocuments buildingId={currentBuildingId} />
          </TabsContent>
          <TabsContent value="contacts" className="mt-4">
            <ResidentContacts buildingId={currentBuildingId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ResidentDashboard;
