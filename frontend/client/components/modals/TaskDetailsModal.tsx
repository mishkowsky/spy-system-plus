import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MapPin as MapIcon,
  Monitor, Receipt, ReceiptText,
  Settings,
  User,
  X, HandFist
} from "lucide-react";
import {
  DeviceChangeTask,
  Metric,
  PunishmentTask,
  PunishmentType,
  TaskStatus,
} from "@/types";
import GeolocationMap from "@/components/GeolocationMap.tsx";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api.ts";
import { useTranslation } from "@/hooks/use-translation";
import { punishmentTypeToRu, taskStatusToRu } from "@/translations/ru.ts";

type CombinedTask =
  | (PunishmentTask & { taskType: "punishment" })
  | (DeviceChangeTask & { taskType: "device-change" });

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: CombinedTask | null;
  onCancelTask?: (task: CombinedTask) => void;
  cancellingTaskId?: number | null;
}

export default function TaskDetailsModal({
  isOpen,
  onClose,
  task,
  onCancelTask,
  cancellingTaskId,
}: TaskDetailsModalProps) {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [latestClientMetric, setLatestClientMetric] = useState<Metric | null>(
    null,
  );
  useEffect(() => {
    if (isOpen && task) {
      loadData();
    }
  }, [isOpen, task]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const clientLatestMetric = await apiClient.get<Metric>(
        `/clients/${task.client.id}/metrics/latest`,
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
  if (!task || !task.status) return null;

  const getStatusBadgeVariant = (status: TaskStatus) => {
    if (!status) {
      return "outline";
    }

    switch (status) {
      case TaskStatus.DONE:
        return "default";
      case TaskStatus.IN_PROGRESS:
        return "secondary";
      case TaskStatus.NEW:
        return "outline";
      case TaskStatus.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTaskTypeDisplay = (task: CombinedTask) => {
    if (task.taskType === "device-change") {
      return t("taskType.deviceChange");
    } else {
      return t("taskType.punishmentTask");
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    if (!status) {
      return <Calendar className="h-4 w-4" />;
    }

    switch (status) {
      case TaskStatus.DONE:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case TaskStatus.NEW:
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case TaskStatus.CANCELLED:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

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
            {task.taskType === "device-change"
              ? `${getTaskTypeDisplay(task)} #${task.id}`
              : `${t("taskType.punishmentTask")} #${task.id}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {t("table.status")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={getStatusBadgeVariant(task.status)}
                  className="text-sm"
                >
                  {task.status
                    ? taskStatusToRu(task.status)
                    : t("table.unknown")}
                </Badge>
                {/*{isTaskOverdue(task) && (*/}
                {/*  <div className="mt-2 flex items-center gap-1 text-red-600 text-xs">*/}
                {/*    <AlertTriangle className="h-3 w-3" />*/}
                {/*    {t("modal.overdue")}*/}
                {/*  </div>*/}
                {/*)}*/}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("modal.taskType")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-sm">
                  {getTaskTypeDisplay(task)}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {task.taskType === "device-change" ? (
              <Monitor className="h-5 w-5" />
            ) : (
              <HandFist className="h-5 w-5" />
            )}
                {t("modal.taskDetails")}
              </CardTitle>
            </CardHeader>
            {task.taskType === "device-change" && (
              <CardContent>
                <p className="text-sm">
                  Заменить устройство с #
                  {task.oldDevice?.deviceId || task.oldDeviceId} на #
                  {task.newDevice?.deviceId || task.newDeviceId}
                </p>
              </CardContent>)
            }
            {task.taskType === "punishment" && (
              <CardContent>
                <div className="space-y-2">
                  {task.type && (
                    <div>
                      <span className="text-sm font-medium">
                        Тип наказания:
                      </span>{" "}
                      <Badge
                        variant={
                          task.type == PunishmentType.PHYSICAL
                            ? "secondary"
                            : task.type == PunishmentType.ELECTRICAL
                              ? "secondary"
                              : "outline"
                        }
                        className="text-xs ml-1"
                      >
                        {punishmentTypeToRu(task.type)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
            </Card>


          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("modal.clientInformation")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">
                    {t("table.name")}:
                  </span>{" "}
                  {task.client ? (
                    <span className="text-sm">
                      {task.client.surname}{" "}{task.client.name}{" "}
                      {task.client.lastname}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Клиент #{task.client.id}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {t("modal.clientId")}:
                  </span>{" "}
                  <span className="text-sm">{task.client.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Geolocation Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                {task.taskType === "device-change" ? "Геолокация устройства" : "Геолокация клиента"}
              </CardTitle>
              {latestClientMetric ? (
                <CardDescription>
                  {t("modal.lastKnownLocation")}:{" "}
                  {formatDateTime(latestClientMetric.timestamp)}
                </CardDescription>
              ) : (
                <div></div>
              )}
            </CardHeader>
            <CardContent>
              <GeolocationMap
                entity={task.taskType === "device-change" ? "device" : "client"}
                metric={latestClientMetric}
                popupText={
                    task.taskType === "device-change"
                    ? "Устройство #" + (task.oldDevice?.deviceId || task.oldDeviceId)
                    : "" + task.client.surname + " " + task.client.name[0] + ". " + task.client.lastname[0] + "."
                }
                formatDateTime={formatDateTime}
              />
            </CardContent>
          </Card>

          {/* Device Information (for device change tasks) */}
          {/*{task.taskType === "device-change" && (*/}
          {/*  <Card>*/}
          {/*    <CardHeader>*/}
          {/*      <CardTitle className="text-lg flex items-center gap-2">*/}
          {/*        <Monitor className="h-5 w-5" />*/}
          {/*        {t("device.properties")}*/}
          {/*      </CardTitle>*/}
          {/*    </CardHeader>*/}
          {/*    <CardContent>*/}
          {/*      <div className="space-y-2">*/}
          {/*        {task.oldDevice && (*/}
          {/*          <div>*/}
          {/*            <span className="text-sm font-medium">*/}
          {/*              {t("modal.oldDevice")}:*/}
          {/*            </span>{" "}*/}
          {/*            <span className="text-sm">{task.oldDevice.deviceId}</span>*/}
          {/*          </div>*/}
          {/*        )}*/}
          {/*        {task.newDevice && (*/}
          {/*          <div>*/}
          {/*            <span className="text-sm font-medium">*/}
          {/*              {t("modal.newDevice")}:*/}
          {/*            </span>{" "}*/}
          {/*            <span className="text-sm">{task.newDevice.deviceId}</span>*/}
          {/*          </div>*/}
          {/*        )}*/}
          {/*        <div>*/}
          {/*          <span className="text-sm font-medium">*/}
          {/*            {t("modal.oldDeviceId")}:*/}
          {/*          </span>{" "}*/}
          {/*          <span className="text-sm">{task.oldDeviceId}</span>*/}
          {/*        </div>*/}
          {/*        <div>*/}
          {/*          <span className="text-sm font-medium">*/}
          {/*            {t("modal.newDeviceId")}:*/}
          {/*          </span>{" "}*/}
          {/*          <span className="text-sm">{task.newDeviceId}</span>*/}
          {/*        </div>*/}
          {/*      </div>*/}
          {/*    </CardContent>*/}
          {/*  </Card>*/}
          {/*)}*/}

          {/* Dates and Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("modal.timeline")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {t("modal.created")}:
                  </span>
                  <span className="text-sm">
                    {formatDateTime(task.createdAt)}
                  </span>
                </div>

                {task.taskType === "punishment" && task.dueDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("modal.dueDate")}:
                    </span>
                    <span className="text-sm">{formatDate(task.dueDate)}</span>
                  </div>
                )}

                {task.taskType === "punishment" && task.updatedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("modal.lastUpdated")}:
                    </span>
                    <span className="text-sm">
                      {formatDateTime(task.updatedAt)}
                    </span>
                  </div>
                )}

                {task.taskType === "device-change" && task.doneAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-600">
                      {t("modal.done")}:
                    </span>
                    <span className="text-sm text-green-600">
                      {formatDateTime(task.doneAt)}
                    </span>
                  </div>
                )}

                {task.taskType === "punishment" && task.completedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-600">
                      {t("modal.completed")}:
                    </span>
                    <span className="text-sm text-green-600">
                      {formatDateTime(task.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cancel Task Button */}
          {task.status !== TaskStatus.DONE &&
            task.status !== TaskStatus.CANCELLED &&
            onCancelTask && (
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <X className="h-4 w-4 mr-2" />
                      {t("modal.cancelTask")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("modal.cancelTask")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("modal.sureCancel")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("modal.keepTask")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onCancelTask(task)}
                        disabled={cancellingTaskId === task.id}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {cancellingTaskId === task.id ? (
                          <>
                            <X className="h-4 w-4 animate-spin mr-2" />
                            {t("modal.cancelling")}
                          </>
                        ) : (
                          t("modal.cancelTask")
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
