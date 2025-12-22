import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus, Trash2 } from "lucide-react";
import { Client, Weekday, MonitoringTimeInterval, Worker, WorkerRole } from "@/types";
import { apiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";
import { morph } from "@/translations/ru.ts";
import { worker } from "globals";

interface ClientMonitoringScheduleModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onScheduleUpdated?: () => void;
}

const getWeekdays = (t: any) => [
  { value: Weekday.MONDAY, label: "Понедельник" },
  { value: Weekday.TUESDAY, label: "Вторник" },
  { value: Weekday.WEDNESDAY, label: "Среда" },
  { value: Weekday.THURSDAY, label: "Четверг" },
  { value: Weekday.FRIDAY, label: "Пятница" },
  { value: Weekday.SATURDAY, label: "Суббота" },
  { value: Weekday.SUNDAY, label: "Воскресенье" },
];

interface ScheduleEntry {
  id?: number;
  weekday: Weekday;
  begin: string;
  ending: string;
  workerId?: number;
  worker?: Worker;
  isNew?: boolean;
  isModified?: boolean;
}

export const ClientMonitoringScheduleModal: React.FC<
  ClientMonitoringScheduleModalProps
> = ({ isOpen, client, onClose, onScheduleUpdated }) => {
  const { t } = useTranslation();
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [originalEntries, setOriginalEntries] = useState<ScheduleEntry[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      loadScheduleAndWorkers();
    }
  }, [isOpen, client]);

  const loadScheduleAndWorkers = async () => {
    if (!client) return;

    setIsLoading(true);
    setError("");

    try {
      const [scheduleData, workersData] = await Promise.all([
        apiClient.get<MonitoringTimeInterval[]>("/monitoring_time_intervals"),
        apiClient.get<Worker[]>("/workers"),
      ]);

      const clientSchedule = scheduleData.filter(
        (interval) => interval.client.id === client.id,
      );

      const survillianceWorkers = workersData.filter((w: Worker) => w.role === WorkerRole.SURVEILLANCE_OFFICER,);

      const entries: ScheduleEntry[] = clientSchedule.map((interval) => ({
        id: interval.id,
        weekday: interval.weekday,
        begin: interval.begin,
        ending: interval.ending,
        workerId: interval.worker.id,
        worker: interval.worker,
        isNew: false,
      }));

      setScheduleEntries(entries);
      setOriginalEntries(JSON.parse(JSON.stringify(entries)));
      setWorkers(survillianceWorkers);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("monitoring.failedToLoadSchedule"),
      );
      console.error("Failed to load schedule:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTimeSlot = (weekday: Weekday) => {
    const newEntry: ScheduleEntry = {
      weekday,
      begin: "09:00:00",
      ending: "17:00:00",
      isNew: true,
    };
    setScheduleEntries([...scheduleEntries, newEntry]);
  };

  const handleUpdateEntry = (
    index: number,
    updates: Partial<ScheduleEntry>,
  ) => {
    const updated = [...scheduleEntries];
    updated[index] = { ...updated[index], ...updates };
    setScheduleEntries(updated);
  };

  const handleRemoveEntry = (index: number) => {
    setScheduleEntries(scheduleEntries.filter((_, i) => i !== index));
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const hasIntervalClash = (): boolean => {
    const weekdayGroups: Record<Weekday, ScheduleEntry[]> = {} as any;

    scheduleEntries.forEach((entry) => {
      if (!weekdayGroups[entry.weekday]) {
        weekdayGroups[entry.weekday] = [];
      }
      weekdayGroups[entry.weekday].push(entry);
    });

    for (const entries of Object.values(weekdayGroups)) {
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const start1 = timeToMinutes(entries[i].begin);
          const end1 = timeToMinutes(entries[i].ending);
          const start2 = timeToMinutes(entries[j].begin);
          const end2 = timeToMinutes(entries[j].ending);

          if (!(end1 <= start2 || end2 <= start1)) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const handleSaveSchedule = async () => {
    if (!client) return;

    setIsSaving(true);
    setError("");

    try {
      if (hasIntervalClash()) {
        setError(t("monitoring.intervalClashDetected"));
        setIsSaving(false);
        return;
      }

      // Identify entries to delete: exist in original but not in current
      const entriesToDelete = originalEntries.filter(
        (original) =>
          !scheduleEntries.some(
            (current) =>
              current.id === original.id &&
              current.weekday === original.weekday,
          ),
      );

      // Identify entries to create: are new
      const entriesToCreate = scheduleEntries.filter(
        (entry) => entry.isNew === true,
      );

      // Identify entries to update: exist in both and have changes
      const entriesToUpdate = scheduleEntries.filter((current) => {
        if (current.isNew) return false;
        const original = originalEntries.find((o) => o.id === current.id);
        if (!original) return false;
        return (
          original.begin !== current.begin ||
          original.ending !== current.ending ||
          original.workerId !== current.workerId
        );
      });

      // Delete entries
      for (const entry of entriesToDelete) {
        if (entry.id) {
          await apiClient.delete(`/monitoring_time_intervals/${entry.id}`);
        }
      }

      // Create new entries
      for (const entry of entriesToCreate) {
        if (!entry.workerId) {
          setError(t("monitoring.selectMonitoringOfficer"));
          setIsSaving(false);
          return;
        }
        const payload = {
          clientId: client.id,
          workerId: entry.workerId,
          weekday: entry.weekday,
          begin: entry.begin,
          ending: entry.ending,
        };
        await apiClient.post("/monitoring_time_intervals", payload);
      }

      // Update existing entries
      for (const entry of entriesToUpdate) {
        if (!entry.id) continue;
        if (!entry.workerId) {
          setError(t("monitoring.selectMonitoringOfficer"));
          setIsSaving(false);
          return;
        }
        const payload = {
          clientId: client.id,
          workerId: entry.workerId,
          weekday: entry.weekday,
          begin: entry.begin,
          ending: entry.ending,
        };
        await apiClient.patch(
          `/monitoring_time_intervals/${entry.id}`,
          payload,
        );
      }

      if (onScheduleUpdated) {
        onScheduleUpdated();
      }

      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("monitoring.failedToSaveSchedule");
      if (errorMessage.includes("422") || errorMessage.includes("clash")) {
        setError(t("monitoring.intervalClash"));
      } else {
        setError(errorMessage);
      }
      console.error("Failed to save schedule:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const timeSlots = scheduleEntries.reduce(
    (acc, entry) => {
      const key = entry.weekday;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    },
    {} as Record<Weekday, ScheduleEntry[]>,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("monitoring.monitoringSchedule")} - {client?.name}{" "}
            {client?.surname} {client?.lastname}
          </DialogTitle>
          <DialogDescription>
            {t("monitoring.monitoringScheduleDescription")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {getWeekdays(t).map((day) => (
                <Card key={day.value}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{day.label}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {timeSlots[day.value]?.length || 0}{" "}
                          {morph(timeSlots[day.value]?.length || 0, ["интервал", "интервала", "интервалов"])}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddTimeSlot(day.value)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        {t("monitoring.add")}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {timeSlots[day.value]?.map((entry, idx) => {
                      const entryIndex = scheduleEntries.indexOf(entry);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                {t("monitoring.startTime")}
                              </Label>
                              <Input
                                type="time"
                                value={entry.begin.substring(0, 5)}
                                onChange={(e) =>
                                  handleUpdateEntry(entryIndex, {
                                    begin: `${e.target.value}:00`,
                                  })
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                {t("monitoring.endTime")}
                              </Label>
                              <Input
                                type="time"
                                value={entry.ending.substring(0, 5)}
                                onChange={(e) =>
                                  handleUpdateEntry(entryIndex, {
                                    ending: `${e.target.value}:00`,
                                  })
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                {t("monitoring.monitoringOfficer")}
                              </Label>
                              <Select
                                value={(entry.workerId || "").toString()}
                                onValueChange={(value) =>
                                  handleUpdateEntry(entryIndex, {
                                    workerId: parseInt(value),
                                  })
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue
                                    placeholder={t("monitoring.selectOfficer")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {workers.map((worker) => (
                                    <SelectItem
                                      key={worker.id}
                                      value={worker.id.toString()}
                                    >
                                      {worker.surname} {worker.name[0]}. {worker.lastname[0]}.
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEntry(entryIndex)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                    {!timeSlots[day.value]?.length && (
                      <div className="text-sm text-muted-foreground p-3">
                        {t("monitoring.noMonitoringScheduled")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("button.cancel")}
          </Button>
          <Button onClick={handleSaveSchedule} disabled={isSaving || isLoading}>
            {isSaving ? t("monitoring.saving") : t("monitoring.saveSchedule")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
