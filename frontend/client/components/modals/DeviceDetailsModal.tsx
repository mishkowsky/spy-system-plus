import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Monitor,
  Bell,
  Activity,
  CheckCircle,
  RefreshCw,
  MapPin as MapIcon,
} from "lucide-react";
import { BatteryIndicator } from "@/components/ui/battery-indicator";
import type { Device, Notification, Metric, Client } from "@/types";
import { NotificationStatus } from "@/types";
import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import EChartsReact from "echarts-for-react";
import GeolocationMap from "@/components/GeolocationMap.tsx";
import { useTranslation } from "@/hooks/use-translation";
import { deviceAssignmentStatusToRu, morph } from "@/translations/ru.ts";

interface DeviceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  onReplaceDevice?: (device: Device) => void;
  refreshTrigger?: number;
}

export default function DeviceDetailsModal({
  isOpen,
  onClose,
  device,
  onReplaceDevice,
  refreshTrigger = 0,
}: DeviceDetailsModalProps) {
  const { t } = useTranslation();
  const [displayDevice, setDisplayDevice] = useState<Device | null>(device);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeInterval, setSelectedTimeInterval] = useState<
    "5m" | "30m" | "1h" | "1d"
  >("1h");
  const [allMetrics, setAllMetrics] = useState<Metric[]>([]);
  const [clientsMap, setClientsMap] = useState<{ [id: number]: Client }>({});
  const [latestDeviceMetric, setLatestDeviceMetric] = useState<Metric | null>(
    null,
  );
  useEffect(() => {
    setDisplayDevice(device);
  }, [device]);

  useEffect(() => {
    if (device && isOpen) {
      if (refreshTrigger > 0) {
        refreshDeviceProperties();
      } else {
        loadDeviceData();
      }
    }
  }, [device?.deviceId, isOpen, refreshTrigger]);

  useEffect(() => {
    if (allMetrics.length > 0) {
      setMetrics(allMetrics);
    }
  }, [allMetrics]);

  const refreshDeviceProperties = useCallback(async () => {
    if (!displayDevice) return;

    try {
      // Fetch only updated device properties (no metrics/geolocation)
      const updatedDevice = await apiClient.get<Device>(
        `/devices/${displayDevice.deviceId}`,
      );
      setDisplayDevice(updatedDevice);
    } catch (error) {
      console.error("Failed to refresh device properties:", error);
    }
  }, [displayDevice]);

  const loadDeviceData = useCallback(async () => {
    if (!displayDevice) return;

    setIsLoading(true);
    try {
      // Fetch updated device properties
      const updatedDevice = await apiClient.get<Device>(
        `/devices/${displayDevice.deviceId}`,
      );
      setDisplayDevice(updatedDevice);

      // Load notifications for this device
      const [notificationsResponse, metricsResponse] = await Promise.all([
        apiClient.get<Notification[]>(
          `/notifications/filtered?relatedEntityId=${displayDevice.deviceId}&type=DEVICE_CHANGE_TASK_CREATION`,
        ),
        apiClient.get<Metric[]>(
          `/metrics/filtered?deviceId=${displayDevice.deviceId}`,
        ),
      ]);

      setNotifications(notificationsResponse);
      // Sort metrics by timestamp (date + time) in ascending order
      const sortedMetrics = [...metricsResponse].sort((a, b) => {
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
      setLatestDeviceMetric(sortedMetrics[sortedMetrics.length - 1]);
      setAllMetrics(sortedMetrics);
      setMetrics(sortedMetrics);

      // Extract unique non-null clientIds and fetch client details
      const uniqueClientIds = Array.from(
        new Set(
          sortedMetrics
            .map((m) => m.clientId)
            .filter((id) => id !== null && id !== undefined),
        ),
      ) as number[];
      if (uniqueClientIds.length > 0) {
        try {
          const clientsData = await Promise.all(
            uniqueClientIds.map((clientId) =>
              apiClient.get<Client>(`/clients/${clientId}`),
            ),
          );
          const clientMap: { [id: number]: Client } = {};
          clientsData.forEach((client) => {
            clientMap[client.id] = client;
          });
          setClientsMap(clientMap);
        } catch (clientError) {
          console.error("Failed to load client details:", clientError);
        }
      }
    } catch (error) {
      console.error("Failed to load device data:", error);
      // Set empty arrays on error
      setNotifications([]);
      setMetrics([]);
      setAllMetrics([]);
      setClientsMap({});
    } finally {
      setIsLoading(false);
    }
  }, [displayDevice]);

  const colorPalette = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
  ];

  const greyColor = "#9ca3af"; // grey for null clientId

  const getColorForClient = (clientId: number | null): string => {
    if (clientId === null || clientId === undefined) {
      return greyColor;
    }
    return colorPalette[clientId % colorPalette.length];
  };

  const getClientInitials = (client: Client): string => {
    const firstInitial = client.name ? client.name.charAt(0).toUpperCase() : "";
    const lastInitial = client.surname
      ? client.surname.charAt(0).toUpperCase()
      : "";
    return (firstInitial + lastInitial).substring(0, 2);
  };

  const getClientLegendName = (
    clientId: number | null,
    metricsCount: number,
  ): string => {
    if (clientId === null || clientId === undefined) {
      return t("table.unassigned");
    }
    const client = clientsMap[clientId];
    if (!client) return `Client #${clientId}`;
    return `${client.surname} ${client.name[0]}. ${client.lastname[0]}. (${metricsCount})`;
  };

  const groupMetricsByClient = (metricsData: Metric[]) => {
    const grouped: { [clientId: string]: Metric[] } = {};
    metricsData.forEach((metric) => {
      const key = metric.clientId !== null ? String(metric.clientId) : "null";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric);
    });
    return grouped;
  };

  const calculateDataZoomRange = (interval: "5m" | "30m" | "1h" | "1d") => {
    if (allMetrics.length === 0) {
      return { start: 0, end: 100 };
    }

    const metricTimestamps = allMetrics.map((m) =>
      new Date(m.timestamp).getTime(),
    );
    const minTime = Math.min(...metricTimestamps);
    const maxTime = Math.max(...metricTimestamps);
    const totalSpan = maxTime - minTime;

    let intervalMs = 0;
    switch (interval) {
      case "5m":
        intervalMs = 5 * 60 * 1000;
        break;
      case "30m":
        intervalMs = 30 * 60 * 1000;
        break;
      case "1h":
        intervalMs = 60 * 60 * 1000;
        break;
      case "1d":
        intervalMs = 24 * 60 * 60 * 1000;
        break;
    }

    const scalePercentage = Math.min((intervalMs / totalSpan) * 100, 100);
    const start = Math.max(0, 100 - scalePercentage);

    return { start, end: 100 };
  };

  if (!displayDevice) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getNotificationIcon = (status: NotificationStatus) => {
    return status === NotificationStatus.UNREAD ? (
      <Bell className="h-4 w-4 text-blue-600" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-600" />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {t("device.deviceDetails", { id: displayDevice.deviceId + "" })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Properties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                {t("device.properties")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("device.deviceId")}:
                    </span>
                    <span className="text-sm">{displayDevice.deviceId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("table.status")}:
                    </span>
                    <Badge
                      variant={
                        displayDevice.status === "ACTIVE"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {displayDevice.status === "ACTIVE"
                        ? t("table.active")
                        : displayDevice.status === "INACTIVE"
                          ? t("table.inactive")
                          : t("table.off")}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("device.batteryLevel")}:
                    </span>
                    <div className="flex items-center gap-2">
                      <BatteryIndicator
                        level={displayDevice.batteryLevel}
                        size="sm"
                      />
                      {/*<span className="text-sm">{device.batteryLevel}%</span>*/}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("device.assignedClient")}:
                    </span>
                    <span className="text-sm">
                      {displayDevice.assignedClientId
                        ? `${displayDevice.assignedClient.surname} ${displayDevice.assignedClient.name} ${displayDevice.assignedClient.lastname}`
                        : t("table.unassigned")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Статус привязки:
                    </span>
                    <Badge
                      variant={
                        displayDevice.assignmentStatus === "ASSIGNED"
                          ? "default"
                          : displayDevice.assignmentStatus === "UNASSIGNED"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {displayDevice.assignmentStatus
                        ? deviceAssignmentStatusToRu(
                            displayDevice.assignmentStatus,
                          )
                        : t("table.unknown")}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {t("table.createDate")}:
                    </span>
                    <span className="text-sm">
                      {displayDevice.lastActiveTime
                        ? formatDateTime(displayDevice.lastActiveTime)
                        : t("table.unknown")}
                    </span>
                  </div>
                  {/*<div className="flex justify-between items-center">*/}
                  {/*  <span className="text-sm font-medium">Created:</span>*/}
                  {/*  <span className="text-sm">*/}
                  {/*    {formatDate(device.createdAt)}*/}
                  {/*  </span>*/}
                  {/*</div>*/}
                </div>
              </div>
              {displayDevice.assignmentStatus === "ASSIGNED" &&
                onReplaceDevice && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        onReplaceDevice(displayDevice);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t("device.replaceDevice")}
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Device Metrics Visualization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t("device.metrics")}
                  {metrics.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {metrics.length}{" "}
                      {morph(metrics.length, ["метрика", "метрики", "метрик"])}
                      {/*{t("device.readings", { count: metrics.length })}*/}
                    </Badge>
                  )}
                </CardTitle>
                <Select
                  value={selectedTimeInterval}
                  onValueChange={(value) =>
                    setSelectedTimeInterval(value as "5m" | "30m" | "1h" | "1d")
                  }
                >
                  <SelectTrigger className="w-45">
                    <SelectValue placeholder={t("device.selectTimeRange")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5m">
                      {t("timeRange.last5Minutes")}
                    </SelectItem>
                    <SelectItem value="30m">
                      {t("timeRange.last30Minutes")}
                    </SelectItem>
                    <SelectItem value="1h">
                      {t("timeRange.last1Hour")}
                    </SelectItem>
                    <SelectItem value="1d">
                      {t("timeRange.last1Day")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : metrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("device.noMetricsData")}
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <EChartsReact
                      option={{
                        tooltip: {
                          trigger: "axis",
                          backgroundColor: "#fff",
                          borderColor: "#ccc",
                          textStyle: {
                            color: "#000",
                          },
                          formatter: (params: any) => {
                            if (Array.isArray(params) && params.length > 0) {
                              const timestamp = params[0].data[0];
                              const tooltipItems = params
                                .map(
                                  (point: any) =>
                                    `<span style="color: ${point.color}">●</span> ${point.seriesName}: ${point.data[1]}`,
                                )
                                .join("<br/>");
                              return `${formatDateTime(timestamp)}<br/>${tooltipItems}`;
                            }
                            return "";
                          },
                        },
                        legend: {
                          top: 8,
                          left: "5%",
                          textStyle: {
                            fontSize: 12,
                            color: "#000",
                          },
                          itemGap: 20,
                          orient: "horizontal",
                          padding: [0, 0, 10, 0],
                        },
                        xAxis: {
                          type: "time",
                          boundaryGap: false,
                          axisLabel: {
                            fontSize: 12,
                            formatter: (timestamp: number) => {
                              const date = new Date(timestamp);
                              return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
                            },
                          },
                        },
                        yAxis: {
                          type: "value",
                          name: t("device.metricValue"),
                        },
                        series: (() => {
                          const groupedByClient = groupMetricsByClient(metrics);
                          return Object.entries(groupedByClient).map(
                            ([clientIdKey, clientMetrics]) => {
                              const clientIdNum =
                                clientIdKey === "null"
                                  ? null
                                  : Number(clientIdKey);
                              const color = getColorForClient(clientIdNum);
                              return {
                                name: getClientLegendName(
                                  clientIdNum,
                                  clientMetrics.length,
                                ),
                                type: "line",
                                showSymbol: false,
                                data: clientMetrics.map((m) => [
                                  m.timestamp,
                                  m.value,
                                ]),
                                smooth: true,
                                itemStyle: {
                                  color: color,
                                },
                                lineStyle: {
                                  color: color,
                                },
                                symbolSize: 6,
                                areaStyle: {
                                  color: color + "1a",
                                },
                                clip: true,
                              };
                            },
                          );
                        })(),
                        grid: {
                          left: "5%",
                          right: "5%",
                          top: "60px",
                          bottom: "50px",
                          containLabel: true,
                        },
                        dataZoom: (() => {
                          const zoomRange =
                            calculateDataZoomRange(selectedTimeInterval);
                          return [
                            {
                              type: "inside",
                              filterMode: "none",
                              xAxisIndex: 0,
                              start: zoomRange.start,
                              end: zoomRange.end,
                              zoomOnMouseWheel: false,
                              moveOnMouseMove: true,
                              moveOnMouseWheel: true,
                            },
                            {
                              type: "slider",
                              orient: "horizontal",
                              xAxisIndex: 0,
                              start: zoomRange.start,
                              end: zoomRange.end,
                              bottom: 8,
                              height: 24,
                              textStyle: {
                                fontSize: 10,
                              },
                              handleSize: "100%",
                              handleStyle: {
                                color: "#3b82f6",
                                borderColor: "#1e40af",
                              },
                              brushSelect: false,
                            },
                          ];
                        })(),
                      }}
                      notMerge={true}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Geolocation Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapIcon className="h-5 w-5" />
                {t("device.geolocation")}
              </CardTitle>
              {latestDeviceMetric ? (
                <CardDescription>
                  {t("device.lastKnownLocation")}:{" "}
                  {formatDateTime(latestDeviceMetric.timestamp)}
                </CardDescription>
              ) : (
                <div></div>
              )}
            </CardHeader>
            <CardContent>
              <GeolocationMap
                entity={"device"}
                metric={latestDeviceMetric}
                popupText={"Device #" + displayDevice.deviceId}
                formatDateTime={formatDateTime}
              />
            </CardContent>
          </Card>

          {/*/!* Device Change Task Notifications *!/*/}
          {/*<Card>*/}
          {/*  <CardHeader>*/}
          {/*    <CardTitle className="text-lg flex items-center gap-2">*/}
          {/*      <Bell className="h-5 w-5" />*/}
          {/*      Device Change Task Notifications*/}
          {/*      {notifications.length > 0 && (*/}
          {/*        <Badge variant="secondary" className="ml-2">*/}
          {/*          {notifications.length}*/}
          {/*        </Badge>*/}
          {/*      )}*/}
          {/*    </CardTitle>*/}
          {/*  </CardHeader>*/}
          {/*  <CardContent>*/}
          {/*    {isLoading ? (*/}
          {/*      <div className="flex justify-center py-8">*/}
          {/*        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>*/}
          {/*      </div>*/}
          {/*    ) : notifications.length === 0 ? (*/}
          {/*      <div className="text-center py-8 text-muted-foreground">*/}
          {/*        No device change task notifications found.*/}
          {/*      </div>*/}
          {/*    ) : (*/}
          {/*      <div className="space-y-3">*/}
          {/*        {notifications.map((notification) => (*/}
          {/*          <div*/}
          {/*            key={notification.id}*/}
          {/*            className="flex items-start gap-3 p-3 border rounded-lg"*/}
          {/*          >*/}
          {/*            {getNotificationIcon(notification.status)}*/}
          {/*            <div className="flex-1">*/}
          {/*              <div className="text-sm font-medium">*/}
          {/*                {notification.text}*/}
          {/*              </div>*/}
          {/*              <div className="text-xs text-muted-foreground mt-1">*/}
          {/*                {formatDateTime(notification.createdAt)}*/}
          {/*              </div>*/}
          {/*            </div>*/}
          {/*            <Badge*/}
          {/*              variant={*/}
          {/*                notification.status === NotificationStatus.UNREAD*/}
          {/*                  ? "default"*/}
          {/*                  : "secondary"*/}
          {/*              }*/}
          {/*            >*/}
          {/*              {notification.status === NotificationStatus.UNREAD*/}
          {/*                ? "Unread"*/}
          {/*                : "Read"}*/}
          {/*            </Badge>*/}
          {/*          </div>*/}
          {/*        ))}*/}
          {/*      </div>*/}
          {/*    )}*/}
          {/*  </CardContent>*/}
          {/*</Card>*/}
        </div>
      </DialogContent>
    </Dialog>
  );
}
