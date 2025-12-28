import React, { useEffect, useState } from "react";
import {
  Client,
  Device,
  DeviceAssignmentStatus,
  Manager,
  Worker,
  WorkerRole,
} from "@/types";
import { apiClient } from "@/lib/api";
import { BatteryIndicator } from "@/components/ui/battery-indicator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertTriangle,
  ChartLine,
  Eye,
  Link2Off,
  Monitor,
  Plus,
  Save,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/hooks/use-translation";
import {
  deviceAssignmentStatusToRu,
  deviceStatusToRu,
} from "@/translations/ru.ts";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip.tsx";

type ThresholdFormValues = {
  metricThreshold: number;
};

interface ClientThresholdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onClientUpdated?: (client: Client) => void;
  currentManager?: Manager | null;
}

export function ClientThresholdModal({
  open,
  onOpenChange,
  client,
  onClientUpdated,
  currentManager,
}: ClientThresholdModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [unassignedDevices, setUnassignedDevices] = useState<Device[]>([]);
  const [deletingDeviceId, setDeletingDeviceId] = useState<number | null>(null);
  const [assigningDeviceId, setAssigningDeviceId] = useState<number | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("threshold");
  const [watchers, setWatchers] = useState<Worker[]>([]);
  const [availableWatchers, setAvailableWatchers] = useState<Worker[]>([]);
  const [isLoadingWatchers, setIsLoadingWatchers] = useState(false);
  const [assigningWatcherId, setAssigningWatcherId] = useState<number | null>(
    null,
  );
  const [unassigningWatcherId, setUnassigningWatcherId] = useState<
    number | null
  >(null);

  const thresholdFormSchema = z.object({
    metricThreshold: z
      .number()
      .min(0, t("validation.thresholdBetweenRange"))
      .max(100, t("validation.thresholdCannotExceed")),
  });

  const form = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdFormSchema),
    defaultValues: {
      metricThreshold: client?.metricThreshold || 0,
    },
  });

  useEffect(() => {
    if (client && open) {
      form.reset({
        metricThreshold: client.metricThreshold,
      });
      loadDevices();
      loadWatchers();
    }
  }, [client, open, form]);

  const loadDevices = async () => {
    if (!client) return;

    setIsLoading(true);
    try {
      const allDevices = await apiClient.get<Device[]>("/devices");
      const clientDevices = allDevices.filter(
        (device) => device.assignedClientId === client.id,
      );
      const unassigned = allDevices.filter(
        (device) => device.assignedClientId === null,
      );
      setDevices(clientDevices);
      setUnassignedDevices(unassigned);
    } catch (error) {
      console.error("Failed to load devices:", error);
      setError(t("thresholdModal.failedToLoadDevices"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadWatchers = async () => {
    if (!client) return;

    setIsLoadingWatchers(true);
    try {
      const allWorkers = await apiClient.get<Worker[]>("/workers");

      const surveillanceOfficers = allWorkers.filter(
        (worker) => worker.role === WorkerRole.SURVEILLANCE_OFFICER,
      );

      try {
        const clientWatchers = await apiClient.get<Worker[]>(
          `/clients/${client.id}/watchers`,
        );

        const assignedWatcherIds = new Set(clientWatchers.map((w) => w.id));
        const unassigned = surveillanceOfficers.filter(
          (worker) => !assignedWatcherIds.has(worker.id),
        );

        setWatchers(clientWatchers);
        setAvailableWatchers(unassigned);
      } catch (watchers_error) {
        setWatchers([]);
        setAvailableWatchers(surveillanceOfficers);
      }
    } catch (error) {
      console.error("Failed to load watchers:", error);
      setWatchers([]);
      setAvailableWatchers([]);
    } finally {
      setIsLoadingWatchers(false);
    }
  };

  const handleSaveThreshold = async (data: ThresholdFormValues) => {
    if (!client) return;

    setIsSaving(true);
    setError("");

    try {
      const updatedClient = await apiClient.patch<Client>(
        `/clients/${client.id}`,
        {
          metricThreshold: data.metricThreshold,
        },
      );

      onClientUpdated?.(updatedClient);
      form.reset({
        metricThreshold: updatedClient.metricThreshold,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("thresholdModal.failedToUpdateThreshold"),
      );
      console.error("Failed to update threshold:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    setDeletingDeviceId(deviceId);
    setError("");

    try {
      // Unassign device from client by setting assignedClientId to null
      await apiClient.patch(`/devices/${deviceId}`, {
        assignedClientId: null,
        assignmentStatus: DeviceAssignmentStatus.UNASSIGNED,
      });

      // Move device from assigned to unassigned
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        setDevices((prev) =>
          prev.filter((device) => device.deviceId !== deviceId),
        );
        setUnassignedDevices((prev) => [
          ...prev,
          {
            ...device,
            assignedClientId: null,
            assignmentStatus: DeviceAssignmentStatus.UNASSIGNED,
          },
        ]);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("thresholdModal.failedToUnassignDevice"),
      );
      console.error("Failed to unassign device:", error);
    } finally {
      setDeletingDeviceId(null);
    }
  };

  const handleAssignDevice = async (deviceId: number) => {
    if (!client) return;

    setAssigningDeviceId(deviceId);
    setError("");

    try {
      // Assign device to client
      await apiClient.patch(`/devices/${deviceId}`, {
        assignedClientId: client.id,
        assignmentStatus: DeviceAssignmentStatus.ASSIGNED,
      });

      // Move device from unassigned to assigned
      const device = unassignedDevices.find((d) => d.deviceId === deviceId);
      if (device) {
        setUnassignedDevices((prev) =>
          prev.filter((device) => device.deviceId !== deviceId),
        );
        setDevices((prev) => [
          ...prev,
          {
            ...device,
            assignedClientId: client.id,
            assignmentStatus: DeviceAssignmentStatus.ASSIGNED,
          },
        ]);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("thresholdModal.failedToAssignDevice"),
      );
      console.error("Failed to assign device:", error);
    } finally {
      setAssigningDeviceId(null);
    }
  };

  const handleAssignWatcher = async (watcherId: number) => {
    if (!client) return;

    setAssigningWatcherId(watcherId);
    setError("");

    try {
      await apiClient.post(`/clients/${client.id}/watcher/${watcherId}`, {});

      const watcher = availableWatchers.find((w) => w.id === watcherId);
      if (watcher) {
        setAvailableWatchers((prev) => prev.filter((w) => w.id !== watcherId));
        setWatchers((prev) => [...prev, watcher]);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("thresholdModal.failedToAssignWatcher"),
      );
      console.error("Failed to assign watcher:", error);
    } finally {
      setAssigningWatcherId(null);
    }
  };

  const handleUnassignWatcher = async (watcherId: number) => {
    if (!client) return;

    setUnassigningWatcherId(watcherId);
    setError("");

    try {
      await apiClient.delete(`/clients/${client.id}/watcher/${watcherId}`);

      const watcher = watchers.find((w) => w.id === watcherId);
      if (watcher) {
        setWatchers((prev) => prev.filter((w) => w.id !== watcherId));
        setAvailableWatchers((prev) => [...prev, watcher]);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t("thresholdModal.failedToUnassignWatcher"),
      );
      console.error("Failed to unassign watcher:", error);
    } finally {
      setUnassigningWatcherId(null);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setError("");
      setActiveTab("threshold");
      form.reset();
    }
    onOpenChange(open);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0 overflow-visible">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t("misc.clientManagement")}: {client.name} {client.surname}{" "}
              {client.lastname}
            </DialogTitle>
            <DialogDescription>
              {t("misc.manageMetricThresholdSettingsDeviceAssignments")}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="threshold"
                className="flex items-center gap-2"
              >
                <ChartLine className="h-4 w-4" />
                {t("misc.metricThreshold")}
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                {t("navigation.devices")}
              </TabsTrigger>
              {/*<TabsTrigger value="watchers" className="flex items-center gap-2">*/}
              {/*  <Eye className="h-4 w-4" />*/}
              {/*  {t("misc.watchers")} ({watchers.length})*/}
              {/*</TabsTrigger>*/}
            </TabsList>

            <TabsContent value="threshold" className="space-y-6 min-w-0">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {t("misc.currentSettings")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("misc.reviewAndUpdateMetricThreshold")}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {t("misc.clientId")}:
                      </span>
                      <Badge variant="outline">{client.id}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {t("misc.email")}:
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {client.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {t("misc.violationsCount")}:
                      </span>
                      <Badge
                        variant={
                          client.violationsCount > 0
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {client.violationsCount}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {t("misc.currentThreshold")}:
                      </span>
                      <Badge variant="outline">{client.metricThreshold}</Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <Form {...form}>
                    <form
                      id="threshold-form"
                      onSubmit={form.handleSubmit(handleSaveThreshold)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="metricThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <div className="space-y-4">
                              <div>
                                <FormLabel className="text-base">
                                  {t("misc.setMetricThreshold")}
                                </FormLabel>
                                <FormDescription>
                                  {t("misc.adjustThresholdValue")}
                                </FormDescription>
                              </div>

                              <div className="space-y-2">
                                <FormControl>
                                  <Slider
                                    id="metricThreshold"
                                    value={[field.value || 0]}
                                    onValueChange={(value) =>
                                      field.onChange(value[0])
                                    }
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                  />
                                </FormControl>

                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    0
                                  </span>
                                  <div className="text-center">
                                    <div className="text-3xl font-bold">
                                      {field.value || 0}
                                    </div>
                                    {/*<span className="text-xs text-muted-foreground">*/}
                                    {/*  {t("misc.currentValue")}*/}
                                    {/*</span>*/}
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    100
                                  </span>
                                </div>
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-6 min-w-0">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {t("misc.assignedDevices")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("misc.manageDevicesAssignedToThisClient")}
                </p>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                    <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t("misc.noDevicesAssignedToThisClient")}
                    </p>
                  </div>
                ) : (
                  <div className="min-w-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("misc.deviceId")}</TableHead>
                          <TableHead>{t("misc.batteryLevel")}</TableHead>
                          <TableHead>{t("misc.status")}</TableHead>
                          <TableHead>Статус привязки</TableHead>
                          <TableHead className="text-right">
                            {t("misc.actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devices.map((device) => (
                          <TableRow key={device.deviceId}>
                            <TableCell className="font-medium">
                              <Badge
                                variant="outline"
                                className={"flex: inner-display gap-2"}
                              >
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                Устройство #{device.deviceId}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <BatteryIndicator
                                level={device.batteryLevel}
                                size="sm"
                              />
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  device.status === "ACTIVE"
                                    ? "outline"
                                    : "destructive"
                                }
                              >
                                {deviceStatusToRu(device.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  device.assignmentStatus === "ASSIGNED"
                                    ? "default"
                                    : device.assignmentStatus === "UNASSIGNED"
                                      ? "outline"
                                      : "secondary"
                                }
                              >
                                {deviceAssignmentStatusToRu(
                                  device.assignmentStatus,
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  {device.assignmentStatus !==
                                  DeviceAssignmentStatus.ASSIGNED ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div>
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={true}
                                          >
                                            {deletingDeviceId ===
                                            device.deviceId ? (
                                              <>
                                                <X className="h-4 w-4 animate-spin mr-2" />
                                                {t("button.unassigning")}
                                              </>
                                            ) : (
                                              <>
                                                <Link2Off className="h-4 w-4 mr-2" />
                                                {t("button.unassign")}
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="bottom"
                                        className="max-w-xs text-center"
                                      >
                                        Чтобы отвязать устройство напрямую,
                                        отмените задачу замены для этого
                                        устройств
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={
                                        deletingDeviceId === device.deviceId
                                      }
                                    >
                                      {deletingDeviceId === device.deviceId ? (
                                        <>
                                          <X className="h-4 w-4 animate-spin mr-2" />
                                          {t("button.unassigning")}
                                        </>
                                      ) : (
                                        <>
                                          <Link2Off className="h-4 w-4 mr-2" />
                                          {t("button.unassign")}
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t("misc.confirmDeviceUnassignment")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {`${t("misc.areYouSureUnassignDevice")}`
                                        .replace(
                                          "{deviceId}",
                                          device.deviceId.toString(),
                                        )
                                        .replace("{name}", client.name)
                                        .replace("{surname}", client.surname)}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t("button.cancel")}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteDevice(device.deviceId)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {t("button.unassignDevice")}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Unassigned Devices Section */}
              <div className="space-y-4">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-2">
                    {t("misc.availableDevices")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("misc.assignAvailableDeviceToThisClient")}
                  </p>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : unassignedDevices.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                      <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {t("misc.noUnassignedDevicesAvailable")}
                      </p>
                    </div>
                  ) : (
                    <div className="min-w-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID устройства</TableHead>
                            <TableHead>Уровень заряда</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>{t("misc.assignmentStatus")}</TableHead>
                            <TableHead className="text-right">
                              {t("misc.actions")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unassignedDevices.map((device) => (
                            <TableRow key={device.deviceId}>
                              <TableCell className="font-medium">
                                <Badge
                                  variant="outline"
                                  className={"flex: inner-display gap-2"}
                                >
                                  <Monitor className="h-4 w-4 text-muted-foreground font-medium" />
                                  Устройство #{device.deviceId}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <BatteryIndicator
                                  level={device.batteryLevel}
                                  size="sm"
                                />
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    device.status === "ACTIVE"
                                      ? "outline"
                                      : "destructive"
                                  }
                                >
                                  {deviceStatusToRu(device.status)}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant={
                                    device.assignmentStatus === "ASSIGNED"
                                      ? "default"
                                      : device.assignmentStatus === "UNASSIGNED"
                                        ? "outline"
                                        : "secondary"
                                  }
                                >
                                  {deviceAssignmentStatusToRu(
                                    device.assignmentStatus,
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {device.assignmentStatus !==
                                DeviceAssignmentStatus.UNASSIGNED ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Button
                                          variant="default"
                                          size="sm"
                                          disabled={true}
                                        >
                                          {assigningDeviceId ===
                                          device.deviceId ? (
                                            <>
                                              <X className="h-4 w-4 animate-spin mr-2" />
                                              {t("misc.assigning")}
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="h-4 w-4 mr-2" />
                                              {t("misc.assign")}
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="bottom"
                                      className="max-w-xs text-center"
                                    >
                                      Чтобы отвязать устройство напрямую,
                                      отмените задачу замены этого устройств
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                      handleAssignDevice(device.deviceId)
                                    }
                                    disabled={
                                      assigningDeviceId === device.deviceId
                                    }
                                  >
                                    {assigningDeviceId === device.deviceId ? (
                                      <>
                                        <X className="h-4 w-4 animate-spin mr-2" />
                                        {t("misc.assigning")}
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("misc.assign")}
                                      </>
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/*<TabsContent value="watchers" className="space-y-6">*/}
            {/*  <div>*/}
            {/*    <h3 className="text-lg font-semibold mb-2">*/}
            {/*      {t("misc.assignedWatchers")}*/}
            {/*    </h3>*/}
            {/*    <p className="text-sm text-muted-foreground mb-4">*/}
            {/*      {t("misc.surveillanceOfficersAssignedDescription")}*/}
            {/*    </p>*/}

            {/*    {isLoadingWatchers ? (*/}
            {/*      <div className="flex justify-center py-8">*/}
            {/*        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>*/}
            {/*      </div>*/}
            {/*    ) : watchers.length === 0 ? (*/}
            {/*      <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">*/}
            {/*        <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />*/}
            {/*        <p className="text-muted-foreground">*/}
            {/*          {t("misc.noWatchersAssignedToThisClient")}*/}
            {/*        </p>*/}
            {/*      </div>*/}
            {/*    ) : (*/}
            {/*      <Table>*/}
            {/*        <TableHeader>*/}
            {/*          <TableRow>*/}
            {/*            <TableHead>{t("misc.watcherName")}</TableHead>*/}
            {/*            <TableHead>{t("misc.email")}</TableHead>*/}
            {/*            <TableHead>{t("misc.role")}</TableHead>*/}
            {/*            <TableHead className="text-right">*/}
            {/*              {t("misc.actions")}*/}
            {/*            </TableHead>*/}
            {/*          </TableRow>*/}
            {/*        </TableHeader>*/}
            {/*        <TableBody>*/}
            {/*          {watchers.map((watcher) => (*/}
            {/*            <TableRow key={watcher.id}>*/}
            {/*              <TableCell className="font-medium">*/}
            {/*                <div className="flex items-center gap-2">*/}
            {/*                  <Eye className="h-4 w-4 text-muted-foreground" />*/}
            {/*                  {watcher.name} {watcher.surname} {watcher.lastname}*/}
            {/*                </div>*/}
            {/*              </TableCell>*/}
            {/*              <TableCell>{watcher.email}</TableCell>*/}
            {/*              <TableCell>*/}
            {/*                <Badge variant="outline">*/}
            {/*                  {watcher.role.replace(/_/g, " ")}*/}
            {/*                </Badge>*/}
            {/*              </TableCell>*/}
            {/*              <TableCell className="text-right">*/}
            {/*                {(watcher.managerId*/}
            {/*                  ? watcher.managerId*/}
            {/*                  : watcher.manager*/}
            {/*                    ? watcher.manager.id*/}
            {/*                    : null) === currentManager?.id ? (*/}
            {/*                  <AlertDialog>*/}
            {/*                    <AlertDialogTrigger asChild>*/}
            {/*                      <Button*/}
            {/*                        variant="destructive"*/}
            {/*                        size="sm"*/}
            {/*                        disabled={unassigningWatcherId === watcher.id}*/}
            {/*                      >*/}
            {/*                        {unassigningWatcherId === watcher.id ? (*/}
            {/*                          <>*/}
            {/*                            <X className="h-4 w-4 animate-spin mr-2" />*/}
            {/*                            {t("misc.removing")}*/}
            {/*                          </>*/}
            {/*                        ) : (*/}
            {/*                          <>*/}
            {/*                            <Trash2 className="h-4 w-4 mr-2" />*/}
            {/*                            {t("misc.remove")}*/}
            {/*                          </>*/}
            {/*                        )}*/}
            {/*                      </Button>*/}
            {/*                    </AlertDialogTrigger>*/}
            {/*                    <AlertDialogContent>*/}
            {/*                      <AlertDialogHeader>*/}
            {/*                        <AlertDialogTitle>*/}
            {/*                          {t("misc.confirmWatcherRemoval")}*/}
            {/*                        </AlertDialogTitle>*/}
            {/*                        <AlertDialogDescription>*/}
            {/*                          {`${t("misc.areYouSureRemoveWatcher")}`*/}
            {/*                            .replace("{name}", watcher.name)*/}
            {/*                            .replace("{surname}", watcher.surname)*/}
            {/*                            .replace("{clientName}", client.name)*/}
            {/*                            .replace(*/}
            {/*                              "{clientSurname}",*/}
            {/*                              client.surname,*/}
            {/*                            )}*/}
            {/*                        </AlertDialogDescription>*/}
            {/*                      </AlertDialogHeader>*/}
            {/*                      <AlertDialogFooter>*/}
            {/*                        <AlertDialogCancel>*/}
            {/*                          {t("button.cancel")}*/}
            {/*                        </AlertDialogCancel>*/}
            {/*                        <AlertDialogAction*/}
            {/*                          onClick={() =>*/}
            {/*                            handleUnassignWatcher(watcher.id)*/}
            {/*                          }*/}
            {/*                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"*/}
            {/*                        >*/}
            {/*                          {t("misc.removeWatcher")}*/}
            {/*                        </AlertDialogAction>*/}
            {/*                      </AlertDialogFooter>*/}
            {/*                    </AlertDialogContent>*/}
            {/*                  </AlertDialog>*/}
            {/*                ) : (*/}
            {/*                  <span className="text-sm text-muted-foreground">*/}
            {/*                    {watcher.manager*/}
            {/*                      ? `${t("misc.notAssignedToYouPleaseContact")} ${watcher.manager.email}`*/}
            {/*                      : t("misc.assignWorkerToSomeManager")}*/}
            {/*                  </span>*/}
            {/*                )}*/}
            {/*              </TableCell>*/}
            {/*            </TableRow>*/}
            {/*          ))}*/}
            {/*        </TableBody>*/}
            {/*      </Table>*/}
            {/*    )}*/}
            {/*  </div>*/}

            {/*  /!* Available Watchers Section *!/*/}
            {/*  <div className="space-y-4">*/}
            {/*    <div className="border-t pt-6">*/}
            {/*      <h3 className="text-lg font-semibold mb-2">*/}
            {/*        {t("thresholdModal.availableWatchers")}*/}
            {/*      </h3>*/}
            {/*      <p className="text-sm text-muted-foreground mb-4">*/}
            {/*        {t("thresholdModal.availableWatchersDescription")}*/}
            {/*      </p>*/}

            {/*      {isLoadingWatchers ? (*/}
            {/*        <div className="flex justify-center py-8">*/}
            {/*          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>*/}
            {/*        </div>*/}
            {/*      ) : availableWatchers.length === 0 ? (*/}
            {/*        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">*/}
            {/*          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />*/}
            {/*          <p className="text-muted-foreground">*/}
            {/*            {t("thresholdModal.noAvailableOfficers")}*/}
            {/*          </p>*/}
            {/*        </div>*/}
            {/*      ) : (*/}
            {/*        <Table>*/}
            {/*          <TableHeader>*/}
            {/*            <TableRow>*/}
            {/*              <TableHead>{t("thresholdModal.watcherName")}</TableHead>*/}
            {/*              <TableHead>{t("misc.email")}</TableHead>*/}
            {/*              <TableHead>{t("table.role")}</TableHead>*/}
            {/*              <TableHead className="text-right">*/}
            {/*                {t("thresholdModal.actions")}*/}
            {/*              </TableHead>*/}
            {/*            </TableRow>*/}
            {/*          </TableHeader>*/}
            {/*          <TableBody>*/}
            {/*            {availableWatchers.map((watcher) => (*/}
            {/*              <TableRow key={watcher.id}>*/}
            {/*                <TableCell className="font-medium">*/}
            {/*                  <div className="flex items-center gap-2">*/}
            {/*                    <Eye className="h-4 w-4 text-muted-foreground" />*/}
            {/*                    {watcher.name} {watcher.surname}{" "}*/}
            {/*                    {watcher.lastname}*/}
            {/*                  </div>*/}
            {/*                </TableCell>*/}
            {/*                <TableCell>{watcher.email}</TableCell>*/}
            {/*                <TableCell>*/}
            {/*                  <Badge variant="secondary">*/}
            {/*                    {watcher.role.replace(/_/g, " ")}*/}
            {/*                  </Badge>*/}
            {/*                </TableCell>*/}
            {/*                <TableCell className="text-right">*/}
            {/*                  <Button*/}
            {/*                    variant="default"*/}
            {/*                    size="sm"*/}
            {/*                    onClick={() => handleAssignWatcher(watcher.id)}*/}
            {/*                    disabled={assigningWatcherId === watcher.id}*/}
            {/*                  >*/}
            {/*                    {assigningWatcherId === watcher.id ? (*/}
            {/*                      <>*/}
            {/*                        <X className="h-4 w-4 animate-spin mr-2" />*/}
            {/*                        {t("thresholdModal.assigning")}*/}
            {/*                      </>*/}
            {/*                    ) : (*/}
            {/*                      <>*/}
            {/*                        <Plus className="h-4 w-4 mr-2" />*/}
            {/*                        {t("thresholdModal.assign")}*/}
            {/*                      </>*/}
            {/*                    )}*/}
            {/*                  </Button>*/}
            {/*                </TableCell>*/}
            {/*              </TableRow>*/}
            {/*            ))}*/}
            {/*          </TableBody>*/}
            {/*        </Table>*/}
            {/*      )}*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*</TabsContent>*/}
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between items-center pt-6 border-t px-6 pb-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/*<Badge variant="outline">Client ID: {client.id}</Badge>*/}
            {/*<span>•</span>*/}
            {/*<span>{devices.length} device(s) assigned</span>*/}
            {/*<span>•</span>*/}
            {/*<span>{unassignedDevices.length} available</span>*/}
          </div>
          <div className="flex gap-2">
            {activeTab === "threshold" && (
              <Button
                form="threshold-form"
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
              >
                {isSaving ? (
                  <>
                    {/*<Save className="mr-2 h-4 w-4 animate-spin" />*/}
                    {t("button.saving")}
                  </>
                ) : (
                  <>
                    {/*<Save className="mr-2 h-4 w-4" />*/}
                    {t("misc.saveThreshold")}
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" onClick={() => handleClose(false)}>
              {t("ui.close")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
