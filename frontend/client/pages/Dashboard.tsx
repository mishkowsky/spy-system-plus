import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import { UserRole } from "@/types";
import ClientDashboard from "./ClientDashboard";
import ManagerDashboard from "./ManagerDashboard";
import SurveillanceOfficerDashboard from "./SurveillanceOfficerDashboard";
import CorrectionsOfficerDashboard from "./CorrectionsOfficerDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) {
    return null;
  }

  switch (user.role) {
    case UserRole.CLIENT:
      return <ClientDashboard />;
    case UserRole.MANAGER:
      return <ManagerDashboard />;
    case UserRole.SURVEILLANCE_OFFICER:
      return <SurveillanceOfficerDashboard />;
    case UserRole.CORRECTIONS_OFFICER:
      return <CorrectionsOfficerDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("dashboardGeneral.unknownRole")}
            </h2>
            <p className="text-gray-600">
              {t("dashboardGeneral.roleNotRecognized")}
            </p>
          </div>
        </div>
      );
  }
}
