import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, AlertCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Client, MonitoringTimeInterval, Weekday, Worker } from "@/types";
import { apiClient } from "@/lib/api";
import { ClientMonitoringGanttCombined } from "@/components/ClientMonitoringGanttCombined.tsx";
import { useTranslation } from "@/hooks/use-translation";
import { morph } from "@/translations/ru.ts";

interface ClientMonitoringGanttByWorkerProps {
  clients: Client[];
  onEditSchedule: (client: Client) => void;
  isLoading: boolean;
  scheduleRefreshTrigger?: number;
}

const WEEKDAYS_ORDER = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
];

// Note: WEEKDAY_LABELS will be dynamically created in the component using the translation function
// to ensure the correct language is used based on the current locale

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const COLOR_PALETTE = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#14b8a6", // teal
  "#f97316", // orange
  "#6366f1", // indigo
];

interface TimeRange {
  start: number;
  end: number;
  interval: MonitoringTimeInterval;
  hasClash?: boolean;
}

export const ClientMonitoringGanttByWorker: React.FC<
  ClientMonitoringGanttByWorkerProps
> = ({ clients, onEditSchedule, isLoading, scheduleRefreshTrigger }) => {
  const { t } = useTranslation();
  const [scheduleData, setScheduleData] = useState<MonitoringTimeInterval[]>(
    [],
  );
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [workerColorMap, setWorkerColorMap] = useState<Map<number, string>>(
    new Map(),
  );

  // Create weekday labels dynamically based on translation
  const WEEKDAY_LABELS: Record<Weekday, string> = {
    [Weekday.MONDAY]: t("weekday.monday"),
    [Weekday.TUESDAY]: t("weekday.tuesday"),
    [Weekday.WEDNESDAY]: t("weekday.wednesday"),
    [Weekday.THURSDAY]: t("weekday.thursday"),
    [Weekday.FRIDAY]: t("weekday.friday"),
    [Weekday.SATURDAY]: t("weekday.saturday"),
    [Weekday.SUNDAY]: t("weekday.sunday"),
  };

  useEffect(() => {
    loadScheduleData();
  }, [scheduleRefreshTrigger]);

  const loadScheduleData = async () => {
    setLoadingSchedule(true);
    try {
      const data = await apiClient.get<MonitoringTimeInterval[]>(
        "/monitoring_time_intervals",
      );
      setScheduleData(data);

      // Create color mapping for workers
      const uniqueWorkers = Array.from(
        new Map(
          data.map((interval) => [interval.worker.id, interval.worker]),
        ).values(),
      );
      const colorMap = new Map<number, string>();
      uniqueWorkers.forEach((worker, index) => {
        colorMap.set(worker.id, COLOR_PALETTE[index % COLOR_PALETTE.length]);
      });
      setWorkerColorMap(colorMap);
    } catch (error) {
      console.error("Failed to load monitoring schedules:", error);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getClientSchedule = (clientId: number): MonitoringTimeInterval[] => {
    return scheduleData.filter((interval) => interval.client.id === clientId);
  };

  const getDayIntervals = (clientId: number, weekday: Weekday): TimeRange[] => {
    return getClientSchedule(clientId)
      .filter((interval) => interval.weekday === weekday)
      .map((interval) => ({
        start: timeToMinutes(interval.begin),
        end: timeToMinutes(interval.ending),
        interval,
      }))
      .sort((a, b) => a.start - b.start);
  };

  const checkClash = (ranges: TimeRange[]): TimeRange[] => {
    return ranges.map((current) => ({
      ...current,
      hasClash: ranges.some(
        (other) =>
          other.interval.id !== current.interval.id &&
          !(current.end <= other.start || current.start >= other.end),
      ),
    }));
  };

  const getPixelPosition = (minutes: number): number => {
    return (minutes / 1440) * 100;
  };

  const getPixelWidth = (startMin: number, endMin: number): number => {
    const duration = endMin - startMin;
    return (duration / 1440) * 100;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const getUniqueWorkers = (): Worker[] => {
    return Array.from(
      new Map(
        scheduleData.map((interval) => [interval.worker.id, interval.worker]),
      ).values(),
    ).sort((a, b) => a.id - b.id);
  };

  if (isLoading || loadingSchedule) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const uniqueWorkers = getUniqueWorkers();

  return (
    <div className="space-y-4">
      {clients.map((client) => {
        const clientSchedule = getClientSchedule(client.id);
        // const totalClashes = WEEKDAYS_ORDER.reduce((acc, weekday) => {
        //   const ranges = checkClash(getDayIntervals(client.id, weekday));
        //   return acc + ranges.filter((r) => r.hasClash).length;
        // }, 0);

        return (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {client.surname} {client.name} {client.lastname}
                  </CardTitle>
                  <CardDescription>{client.email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {t("monitoring.monitoringSlots", {
                      count: String(clientSchedule.length), ending: morph(clientSchedule.length, null)
                    })}
                  </Badge>
                  {/*{totalClashes > 0 && (*/}
                  {/*  <Badge variant="destructive">*/}
                  {/*    <AlertCircle className="h-3 w-3 mr-1" />*/}
                  {/*    {t("monitoring.clashes", { count: String(totalClashes) })}*/}
                  {/*  </Badge>*/}
                  {/*)}*/}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExpandedClient(
                        expandedClient === client.id ? null : client.id,
                      )
                    }
                  >
                    {expandedClient === client.id ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        {t("monitoring.hide")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        {t("monitoring.view")}
                      </>
                    )}
                  </Button>
                  <Button size="sm" onClick={() => onEditSchedule(client)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("button.edit")}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedClient === client.id && (
              <CardContent>
                <ClientMonitoringGanttCombined
                  isLoading={isLoading}
                  scheduleRefreshTrigger={scheduleRefreshTrigger}
                  groupBy="worker"
                  intervals={getClientSchedule(client.id)}
                />
              </CardContent>
              // <CardContent>
              //   {clientSchedule.length === 0 ? (
              //     <div className="py-8 text-center text-muted-foreground">
              //       <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              //       <p>No monitoring schedule configured</p>
              //     </div>
              //   ) : (
              //     <div className="space-y-4">
              //       {totalClashes > 0 && (
              //         <Alert variant="destructive">
              //           <AlertCircle className="h-4 w-4" />
              //           <AlertDescription>
              //             {totalClashes} interval clash(es) detected.
              //             Overlapping time slots cannot be saved.
              //           </AlertDescription>
              //         </Alert>
              //       )}
              //
              //       {/* Gantt Chart */}
              //       <div className="overflow-x-auto border rounded-lg">
              //         {/* Time Header */}
              //         <div className="flex bg-muted/30 sticky top-0 z-10">
              //           <div className="w-32 flex-shrink-0 border-r p-2 text-xs font-semibold">
              //             Day
              //           </div>
              //           <div className="flex-1 relative">
              //             {HOURS.map((hour) => (
              //               <div
              //                 key={hour}
              //                 className="absolute top-0 bottom-0 border-r text-xs text-center py-2 font-medium text-muted-foreground"
              //                 style={{
              //                   left: `${(hour / 24) * 100}%`,
              //                   width: `${(1 / 24) * 100}%`,
              //                   lineHeight: "1.5rem",
              //                 }}
              //               >
              //                 {String(hour).padStart(2, "0")}:00
              //               </div>
              //             ))}
              //           </div>
              //         </div>
              //
              //         {/* Gantt Rows */}
              //         {WEEKDAYS_ORDER.map((weekday) => {
              //           const ranges = checkClash(
              //             getDayIntervals(client.id, weekday),
              //           );
              //           return (
              //             <div key={weekday} className="flex border-b">
              //               {/* Day Label */}
              //               <div className="w-32 flex-shrink-0 border-r p-3 text-sm font-medium bg-muted/10 flex items-center">
              //                 {WEEKDAY_LABELS[weekday]}
              //               </div>
              //
              //               {/* Timeline */}
              //               <div className="flex-1 relative bg-white min-h-12">
              //                 {/* Hour gridlines */}
              //                 {HOURS.map((hour) => (
              //                   <div
              //                     key={`grid-${hour}`}
              //                     className="absolute top-0 bottom-0 border-r border-muted/50"
              //                     style={{
              //                       left: `${(hour / 24) * 100}%`,
              //                       width: `${(1 / 24) * 100}%`,
              //                     }}
              //                   />
              //                 ))}
              //
              //                 {/* Monitoring slots */}
              //                 {ranges.map((range, idx) => (
              //                   <div
              //                     key={idx}
              //                     className={`absolute top-1 bottom-1 rounded-md border-2 flex items-center px-2 text-xs font-medium text-white overflow-hidden cursor-pointer transition-colors ${
              //                       range.hasClash
              //                         ? "bg-red-600 border-red-800 opacity-75 hover:opacity-100"
              //                         : "border-blue-800 hover:opacity-90"
              //                     }`}
              //                     style={{
              //                       left: `${getPixelPosition(range.start)}%`,
              //                       width: `${getPixelWidth(
              //                         range.start,
              //                         range.end,
              //                       )}%`,
              //                       backgroundColor: range.hasClash
              //                         ? "#dc2626"
              //                         : workerColorMap.get(range.interval.worker.id),
              //                       borderColor: workerColorMap.get(
              //                         range.interval.worker.id,
              //                       ),
              //                     }}
              //                     title={`${range.interval.worker.name} ${range.interval.worker.surname} (${formatTime(
              //                       range.start,
              //                     )} - ${formatTime(range.end)})`}
              //                   >
              //                     <span className="truncate">
              //                       {range.interval.worker.name.substring(0, 3)}{" "}
              //                       - {formatTime(range.start)} -{" "}
              //                       {formatTime(range.end)}
              //                     </span>
              //                   </div>
              //                 ))}
              //
              //                 {/* No slots indicator */}
              //                 {ranges.length === 0 && (
              //                   <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              //                     No monitoring
              //                   </div>
              //                 )}
              //               </div>
              //             </div>
              //           );
              //         })}
              //       </div>
              //
              //       {/* Legend */}
              //       <div className="border rounded-lg p-4 bg-muted/30">
              //         <h4 className="font-semibold text-sm mb-3">
              //           Worker Colors:
              //         </h4>
              //         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              //           {uniqueWorkers.map((worker) => (
              //             <div
              //               key={worker.id}
              //               className="flex items-center gap-2 text-sm"
              //             >
              //               <div
              //                 className="w-4 h-4 rounded border border-gray-300"
              //                 style={{
              //                   backgroundColor: workerColorMap.get(worker.id),
              //                 }}
              //               />
              //               <span className="truncate">
              //                 {worker.name} {worker.surname.substring(0, 1)}.
              //               </span>
              //             </div>
              //           ))}
              //         </div>
              //       </div>
              //     </div>
              //   )}
              // </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
