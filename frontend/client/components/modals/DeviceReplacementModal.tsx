import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import type { Device, Client, DeviceChangeTask } from "@/types";
import { AlertTriangle, Monitor, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge.tsx";
import { useTranslation } from "@/hooks/use-translation";

interface DeviceReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onSuccess: () => void;
}

export default function DeviceReplacementModal({
  isOpen,
  onClose,
  device,
  onSuccess,
}: DeviceReplacementModalProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedNewDeviceId, setSelectedNewDeviceId] = useState<
    string | undefined
  >(undefined);
  const [selectedExecutorId, setSelectedExecutorId] = useState<
    string | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen && device) {
      loadData();
    }
  }, [isOpen, device]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    let res;
    try {
      const [devicesResponse, clientsResponse, workersResponse] =
        await Promise.all([
          apiClient.get<Device[]>("/devices"),
          apiClient.get<Client[]>("/clients"),
          apiClient.get<any[]>("/workers"),
        ]);

      // Filter for unassigned devices only
      const unassignedDevices = devicesResponse.filter(
        (d) =>
          d.assignmentStatus === "UNASSIGNED" &&
          d.deviceId !== device?.deviceId,
      );
      setAvailableDevices(unassignedDevices);
      setClients(clientsResponse);
      res = workersResponse.filter((w) => {
        return w.role === "CORRECTIONS_OFFICER";
      });
      setWorkers(res);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(t("device.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !device ||
      !selectedNewDeviceId ||
      !selectedExecutorId ||
      selectedNewDeviceId === "no-devices" ||
      selectedExecutorId === "no-workers"
    ) {
      setError(t("validation.selectReplacementAndOfficer"));
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const deviceChangeTask = {
        status: "NEW",
        clientId: device.assignedClientId || 0,
        oldDeviceId: device.deviceId,
        newDeviceId: parseInt(selectedNewDeviceId),
        executionerId: parseInt(selectedExecutorId),
        creatorId: user?.id || 1, // Current user ID
      };

      await apiClient.post<DeviceChangeTask>(
        "/device_change_tasks",
        deviceChangeTask,
      );

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Failed to create device replacement task:", error);
      setError(
        error.response?.data?.error || t("device.failedToCreateReplacement"),
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSelectedNewDeviceId(undefined);
    setSelectedExecutorId(undefined);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!device) return null;

  const assignedClient = clients.find((c) => c.id === device.assignedClientId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t("device.replaceDevice")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Device Info */}
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <div>
                  <strong>{t("misc.device")}:</strong> #{device.deviceId}
                </div>
                <div className="space-x-1">
                  <strong>{t("table.status")}:</strong>
                  <Badge
                    variant={
                      device.status === "ACTIVE" ? "default" : "destructive"
                    }
                  >
                    {device.status === "ACTIVE"
                      ? t("table.active")
                      : device.status === "INACTIVE"
                        ? t("table.inactive")
                        : t("table.off")}
                  </Badge>
                </div>
                {assignedClient && (
                  <div>
                    <strong>{t("table.client")}:</strong> {assignedClient.name}{" "}
                    {assignedClient.surname}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* New Device Selection */}
              <div className="space-y-2">
                <Label htmlFor="newDevice">
                  {t("device.selectReplacementDevice")}
                </Label>
                <Select
                  value={selectedNewDeviceId || ""}
                  onValueChange={(value) =>
                    setSelectedNewDeviceId(value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("device.chooseReplacementDevice")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDevices.length === 0 ? (
                      <SelectItem value="no-devices" disabled>
                        {t("device.noAvailableDevices")}
                      </SelectItem>
                    ) : (
                      availableDevices.map((dev) => (
                        <SelectItem
                          key={dev.deviceId}
                          value={dev.deviceId.toString()}
                        >
                          {t("misc.device")} #{dev.deviceId} (
                          {t("misc.battery")}: {dev.batteryLevel}%)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Executor Selection */}
              <div className="space-y-2">
                <Label htmlFor="executor">{t("device.assignToOfficer")}</Label>
                <Select
                  value={selectedExecutorId || ""}
                  onValueChange={(value) =>
                    setSelectedExecutorId(value || undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("device.selectOfficer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.length === 0 ? (
                      <SelectItem value="no-workers" disabled>
                        {t("device.noOfficersAvailable")}
                      </SelectItem>
                    ) : (
                      workers.map((worker) => (
                        <SelectItem
                          key={worker.id}
                          value={worker.id.toString()}
                        >
                          {worker.name} {worker.surname} {worker.lastname}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            {t("button.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isCreating ||
              !selectedNewDeviceId ||
              !selectedExecutorId ||
              selectedNewDeviceId === "no-devices" ||
              selectedExecutorId === "no-workers"
            }
          >
            {isCreating
              ? t("device.creatingTask")
              : t("device.createReplacementTask")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
