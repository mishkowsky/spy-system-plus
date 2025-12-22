import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, AlertCircle } from "lucide-react";
import { MonitoringTimeInterval, Weekday, Worker, Client } from "@/types";
import { apiClient } from "@/lib/api";
import { useTranslation } from "@/hooks/use-translation";

interface ClientMonitoringGanttCombinedProps {
  isLoading: boolean;
  scheduleRefreshTrigger?: number;
  intervals?: MonitoringTimeInterval[];
  groupBy?: "client" | "worker";
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
  entityIndex: number;
  color: string;
}

export const ClientMonitoringGanttCombined: React.FC<
  ClientMonitoringGanttCombinedProps
> = ({
  isLoading,
  scheduleRefreshTrigger,
  intervals: providedIntervals,
  groupBy = "client",
}) => {
  const { t } = useTranslation();
  const [scheduleData, setScheduleData] = useState<MonitoringTimeInterval[]>(
    [],
  );
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [colorMap, setColorMap] = useState<Map<number, string>>(new Map());

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

  const WEEKDAY_LABELS_LONG: Record<Weekday, string> = {
    [Weekday.MONDAY]: "Понедельник",
    [Weekday.TUESDAY]: "Вторник",
    [Weekday.WEDNESDAY]: "Среда",
    [Weekday.THURSDAY]: "Четверг",
    [Weekday.FRIDAY]: "Пятница",
    [Weekday.SATURDAY]: "Суббота",
    [Weekday.SUNDAY]: "Воскресенье",
  };

  useEffect(() => {
    if (providedIntervals) {
      setScheduleData(providedIntervals);
      buildColorMap(providedIntervals);
    } else {
      loadScheduleData();
    }
  }, [scheduleRefreshTrigger, providedIntervals]);

  const buildColorMap = (data: MonitoringTimeInterval[]) => {
    const colorMapping = new Map<number, string>();
    if (groupBy === "client") {
      const uniqueClients = Array.from(
        new Map(
          data.map((interval) => [interval.client.id, interval.client]),
        ).values(),
      );
      uniqueClients.forEach((client, index) => {
        colorMapping.set(
          client.id,
          COLOR_PALETTE[index % COLOR_PALETTE.length],
        );
      });
    } else {
      const uniqueWorkers = Array.from(
        new Map(
          data.map((interval) => [interval.worker.id, interval.worker]),
        ).values(),
      );
      uniqueWorkers.forEach((worker, index) => {
        colorMapping.set(
          worker.id,
          COLOR_PALETTE[index % COLOR_PALETTE.length],
        );
      });
    }
    setColorMap(colorMapping);
  };

  const loadScheduleData = async () => {
    setLoadingSchedule(true);
    try {
      const data = await apiClient.get<MonitoringTimeInterval[]>(
        "/monitoring_time_intervals",
      );
      setScheduleData(data);
      buildColorMap(data);
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

  const getDayIntervals = (weekday: Weekday): TimeRange[] => {
    if (groupBy === "client") {
      return scheduleData
        .filter((interval) => interval.weekday === weekday)
        .map((interval) => {
          const clientIndex = Array.from(colorMap.keys()).indexOf(
            interval.client.id,
          );
          return {
            start: timeToMinutes(interval.begin),
            end: timeToMinutes(interval.ending),
            interval,
            entityIndex: clientIndex,
            color: colorMap.get(interval.client.id) || COLOR_PALETTE[0],
          };
        })
        .sort((a, b) => a.start - b.start);
    } else {
      return scheduleData
        .filter((interval) => interval.weekday === weekday)
        .map((interval) => {
          const workerIndex = Array.from(colorMap.keys()).indexOf(
            interval.worker.id,
          );
          return {
            start: timeToMinutes(interval.begin),
            end: timeToMinutes(interval.ending),
            interval,
            entityIndex: workerIndex,
            color: colorMap.get(interval.worker.id) || COLOR_PALETTE[0],
          };
        })
        .sort((a, b) => a.start - b.start);
    }
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

  const getUniqueEntities = () => {
    if (groupBy === "client") {
      return Array.from(
        new Map(
          scheduleData.map((interval) => [interval.client.id, interval.client]),
        ).values(),
      ).sort((a, b) => a.id - b.id);
    } else {
      return Array.from(
        new Map(
          scheduleData.map((interval) => [interval.worker.id, interval.worker]),
        ).values(),
      ).sort((a, b) => a.id - b.id);
    }
  };

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  if (isLoading || loadingSchedule) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const uniqueEntities = getUniqueEntities();
  const hasClashes = scheduleData.length > 0 && detectClashes(scheduleData);
  const entityLabel =
    groupBy === "client" ? t("table.client") : t("roles.client");

  return (
    <div className="space-y-4">
      {/*<Card>*/}
      {/*  <CardHeader>*/}
      {/*    <CardTitle>*/}
      {/*      {groupBy === "client"*/}
      {/*        ? "Combined Client Monitoring Schedule"*/}
      {/*        : "Combined Worker Monitoring Schedule"}*/}
      {/*    </CardTitle>*/}
      {/*    <CardDescription>*/}
      {/*      {groupBy === "client"*/}
      {/*        ? "Weekly monitoring schedule for all clients with color-coded assignment"*/}
      {/*        : "Weekly monitoring schedule for all workers with color-coded assignment"}*/}
      {/*    </CardDescription>*/}
      {/*  </CardHeader>*/}
      <CardContent>
        {scheduleData.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Расписание слежки не настроено</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hasClashes && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Обнаружены перекрывающиеся интервалы мониторинга. Сотрудник слежки не может контролировать нескольких клиентов
                  одновременно.
                </AlertDescription>
              </Alert>
            )}

            {/* Gantt Chart */}
            <div className="overflow-x-auto border rounded-lg">
              {/* Time Header */}
              <div className="flex bg-muted/30 sticky top-0 z-10">
                <div className="w-12 flex-shrink-0 border-r p-2 text-xs font-semibold">
                  День
                </div>
                <div className="flex-1 relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute top-0 bottom-0 border-r text-xs text-center py-2 font-medium text-muted-foreground"
                      style={{
                        left: `${(hour / 24) * 100}%`,
                        width: `${(1 / 24) * 100}%`,
                        lineHeight: "1.5rem",
                      }}
                    >
                      {String(hour).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Gantt Rows */}
              {WEEKDAYS_ORDER.map((weekday) => {
                const ranges = getDayIntervals(weekday);
                return (
                  <div key={weekday} className="flex border-b">
                    {/* Day Label */}
                    <div className="w-12 flex-shrink-0 border-r p-3 text-sm font-medium bg-muted/10 flex items-center">
                      {WEEKDAY_LABELS[weekday]}
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 relative bg-white min-h-16 flex items-center">
                      {/* Hour gridlines */}
                      {HOURS.map((hour) => (
                        <div
                          key={`grid-${hour}`}
                          className="absolute top-0 bottom-0 border-r border-muted/50"
                          style={{
                            left: `${(hour / 24) * 100}%`,
                            width: `${(1 / 24) * 100}%`,
                          }}
                        />
                      ))}

                      {/* Monitoring slots */}
                      {ranges.map((range, idx) => {
                        const entityName =
                          groupBy === "client"
                            ? `${range.interval.client.surname}`
                            : `${range.interval.worker.surname}`;

                        return (
                          <div
                            key={idx}
                            className="absolute h-full rounded-md border-2 flex items-center px-2 text-xs font-medium text-white overflow-hidden cursor-pointer transition-all hover:opacity-100 hover:shadow-md"
                            style={{
                              left: `${getPixelPosition(range.start)}%`,
                              width: `${getPixelWidth(
                                range.start,
                                range.end,
                              )}%`,
                              backgroundColor: range.color,
                              borderColor: range.color,
                              opacity: 0.85,
                            }}
                            title={`${entityName} (${formatTime(range.start)} - ${formatTime(range.end)})`}
                          >
                            <span className="truncate text-xs">
                              {entityName} -{" "}
                              {formatTime(range.start)} -{" "}
                              {formatTime(range.end)}
                            </span>
                          </div>
                        );
                      })}

                      {/* No slots indicator */}
                      {ranges.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                          Нет расписания
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold text-sm mb-3">Обозначения</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {uniqueEntities.map((entity) => {
                  const entityId = groupBy === "client" ? entity.id : entity.id;
                  const entityDisplayName =
                    groupBy === "client"
                      ? `${entity.surname} ${entity.name[0]}. ${entity.lastname[0]}.`
                      : `${entity.surname} ${entity.name[0]}. ${entity.lastname[0]}.`;

                  return (
                    <div
                      key={entityId}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="w-4 h-4 rounded border-2"
                        style={{
                          backgroundColor: colorMap.get(entityId),
                          borderColor: colorMap.get(entityId),
                        }}
                      />
                      <span className="truncate">{entityDisplayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {/*</Card>*/}
    </div>
  );
};

function detectClashes(intervals: MonitoringTimeInterval[]): boolean {
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Group by weekday and worker
  const groupedByWorkerAndDay = new Map<string, MonitoringTimeInterval[]>();
  intervals.forEach((interval) => {
    const key = `${interval.worker.id}-${interval.weekday}`;
    if (!groupedByWorkerAndDay.has(key)) {
      groupedByWorkerAndDay.set(key, []);
    }
    groupedByWorkerAndDay.get(key)!.push(interval);
  });

  // Check for overlaps within each worker-day group
  for (const intervals of groupedByWorkerAndDay.values()) {
    for (let i = 0; i < intervals.length; i++) {
      for (let j = i + 1; j < intervals.length; j++) {
        const a = intervals[i];
        const b = intervals[j];
        const aStart = timeToMinutes(a.begin);
        const aEnd = timeToMinutes(a.ending);
        const bStart = timeToMinutes(b.begin);
        const bEnd = timeToMinutes(b.ending);

        // Check if intervals overlap
        if (!(aEnd <= bStart || aStart >= bEnd)) {
          return true;
        }
      }
    }
  }

  return false;
}
