import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, MapPin as MapIcon, User } from "lucide-react";
import {
  DeviceChangeTask,
  Client,
  Metric,
  PunishmentTask,
  PunishmentType,
  TaskStatus,
} from "@/types";
import GeolocationMap from "@/components/GeolocationMap.tsx";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api.ts";
import { useTranslation } from "@/hooks/use-translation";

type CombinedTask =
  | (PunishmentTask & { taskType: "punishment" })
  | (DeviceChangeTask & { taskType: "device-change" });

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

export default function ClientGeolocationModal({
  isOpen,
  onClose,
  client,
}: TaskDetailsModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [latestClientMetric, setLatestClientMetric] = useState<Metric | null>(
    null,
  );
  useEffect(() => {
    if (isOpen && client) {
      loadData();
    }
  }, [isOpen, client]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const clientLatestMetric = await apiClient.get<Metric>(
        `/clients/${client.id}/metrics/latest`,
      );
      // const manager = await apiClient.get<Manager>(`/managers/${user.id}`);
      setLatestClientMetric(clientLatestMetric);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(t("error.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  if (!client) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isTaskOverdue = (task: CombinedTask) => {
    if (task.taskType === "device-change") {
      return (
        new Date(Date.now() - 24 * 60 * 60 * 1000) > new Date(task.createdAt) &&
        task.status === TaskStatus.NEW
      );
    } else {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return (
        new Date(task.createdAt) < thirtyDaysAgo &&
        task.status !== TaskStatus.DONE
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("misc.clientDetails")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("misc.clientInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">{t("misc.name")}</span>{" "}
                  {client ? (
                    <span className="text-sm">
                      {client.name} {client.surname} {client.lastname}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t("table.client")} {client.id}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {t("misc.clientIdLabel")}
                  </span>{" "}
                  <span className="text-sm">{client.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Geolocation Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                {t("misc.clientGeolocation")}
              </CardTitle>
              {latestClientMetric ? (
                <CardDescription>
                  {t("misc.lastKnownLocation")}{" "}
                  {formatDateTime(latestClientMetric.timestamp)}
                </CardDescription>
              ) : (
                <div></div>
              )}
            </CardHeader>
            <CardContent>
              <GeolocationMap
                entity={"client"}
                metric={latestClientMetric}
                popupText={"" + client.surname + " " + client.name[0] + ". " + client.lastname[0] + "."}
                formatDateTime={formatDateTime}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
