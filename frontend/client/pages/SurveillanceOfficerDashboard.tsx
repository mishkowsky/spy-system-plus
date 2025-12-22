import React, { useState, useEffect } from "react";
import {
  Client,
  PunishmentTask,
  TimeInterval,
  Weekday,
  WorkSchedule,
} from "@/types";
import { apiClient } from "@/lib/api";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  Clock,
  Eye,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import TaskDetailsModal from "@/components/modals/TaskDetailsModal.tsx";
import ClientGeolocationModal from "@/components/modals/ClientGeolocationModal.tsx";
import { ClientMonitoringGanttCombined } from "@/components/ClientMonitoringGanttCombined";
import { morph } from "@/translations/ru.ts";
import { Textarea } from "@/components/ui/textarea.tsx";

export default function SurveillanceOfficerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState<Client[]>([]);
  const [schedule, setSchedule] = useState<WorkSchedule[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cause, setCause] = useState("");
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case "schedule":
          await loadSchedule();
          break;
        case "clients":
          await loadClients();
          break;
        case "monitoring-schedule":
          await loadClients();
          break;
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedule = async () => {
    try {
      // Use time_intervals filtered endpoint for this worker
      const intervals = await apiClient.get<TimeInterval[]>(
        `/time_intervals/filtered?workerId=${user?.id}`,
      );
      // Convert TimeInterval to WorkSchedule format for compatibility
      const schedule: WorkSchedule[] = intervals.map((interval) => ({
        id: interval.id.toString(),
        employeeId: interval.workerId.toString(),
        dayOfWeek: getWeekdayNumber(interval.weekday),
        startTime: interval.begin.substring(0, 5), // Convert HH:MM:SS to HH:MM
        endTime: interval.ending.substring(0, 5),
        isWorkDay: true,
      }));
      setSchedule(schedule);
    } catch (error) {
      console.error("Failed to load schedule:", error);
    }
  };

  const getWeekdayNumber = (weekday: Weekday): number => {
    const weekdayMap = {
      [Weekday.MONDAY]: 0,
      [Weekday.TUESDAY]: 1,
      [Weekday.WEDNESDAY]: 2,
      [Weekday.THURSDAY]: 3,
      [Weekday.FRIDAY]: 4,
      [Weekday.SATURDAY]: 5,
      [Weekday.SUNDAY]: 6,
    };
    return weekdayMap[weekday];
  };

  const getDayName = (dayIndex: number): string => {
    const days = [
      t("days.monday"),
      t("days.tuesday"),
      t("days.wednesday"),
      t("days.thursday"),
      t("days.friday"),
      t("days.saturday"),
      t("days.sunday"),
    ];
    return days[dayIndex];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const clients = await apiClient.get<Client[]>("/clients");
      setClients(clients);
    } catch (error) {
      console.error("Failed to load clients:", error);
      setError(t("surveillanceOfficer.failedToLoadClients"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPunishmentTask = async () => {
    if (!selectedClient) return;

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const newTask = await apiClient.post<PunishmentTask>(
        "/punishment_tasks",
        {
          clientId: selectedClient.id,
          creatorId: user?.id,
          cause: cause.trim() || undefined,
        },
      );

      // Update the client's violations count in local state
      setClients((prev) =>
        prev.map((client) =>
          client.id === selectedClient.id
            ? { ...client, violationsCount: client.violationsCount + 1 }
            : client,
        ),
      );

      setSuccess(
        t("taskManagement.taskRegistered", {
          name: selectedClient.name,
          surname: selectedClient.surname,
        }),
      );
      setIsConfirmModalOpen(false);
      setSelectedClient(null);
      setCause("");
    } catch (error) {
      setError(t("surveillanceOfficer.failedToRegisterTask"));
      console.error("Failed to create punishment task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmModal = (client: Client) => {
    setSelectedClient(client);
    setIsConfirmModalOpen(true);
    setError("");
    setSuccess("");
    setCause("");
  };

  const openDetailsModal = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
    setError("");
    setSuccess("");
    setCause("");
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Success/Error Messages */}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            {/*<TabsTrigger value="schedule" className="flex items-center gap-2">*/}
            {/*  <Calendar className="h-4 w-4" />*/}
            {/*  My Schedule*/}
            {/*</TabsTrigger>*/}
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("surveillanceOfficer.clientList")}
            </TabsTrigger>
            <TabsTrigger
              value="monitoring-schedule"
              className="flex items-center gap-2"
            >
              <Monitor className="h-4 w-4" />
              {t("surveillanceOfficer.monitoringSchedule")}
            </TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          {/*<TabsContent value="schedule">*/}
          {/*  <Card>*/}
          {/*    <CardHeader>*/}
          {/*      <CardTitle>My Work Schedule</CardTitle>*/}
          {/*      <CardDescription>*/}
          {/*        Your weekly work schedule and time allocation*/}
          {/*      </CardDescription>*/}
          {/*    </CardHeader>*/}
          {/*    <CardContent>*/}
          {/*      {isLoading ? (*/}
          {/*        <div className="flex justify-center py-8">*/}
          {/*          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>*/}
          {/*        </div>*/}
          {/*      ) : (*/}
          {/*        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">*/}
          {/*          {Array.from({ length: 7 }, (_, dayIndex) => {*/}
          {/*            const daySchedule = schedule.find(*/}
          {/*              (s) => s.dayOfWeek === dayIndex,*/}
          {/*            );*/}

          {/*            return (*/}
          {/*              <Card*/}
          {/*                key={dayIndex}*/}
          {/*                className={`${*/}
          {/*                  daySchedule && daySchedule.isWorkDay*/}
          {/*                    ? "border-primary/20 bg-primary/5"*/}
          {/*                    : "border-border bg-muted/30"*/}
          {/*                }`}*/}
          {/*              >*/}
          {/*                <CardHeader className="pb-2">*/}
          {/*                  <CardTitle className="text-sm font-medium flex items-center gap-2">*/}
          {/*                    <Clock className="h-3 w-3" />*/}
          {/*                    {getDayName(dayIndex)}*/}
          {/*                  </CardTitle>*/}
          {/*                </CardHeader>*/}
          {/*                <CardContent>*/}
          {/*                  {daySchedule && daySchedule.isWorkDay ? (*/}
          {/*                    <div className="space-y-2">*/}
          {/*                      <Badge variant="default" className="text-xs">*/}
          {/*                        Work Day*/}
          {/*                      </Badge>*/}
          {/*                      <div className="text-xs text-muted-foreground">*/}
          {/*                        {daySchedule.startTime} -{" "}*/}
          {/*                        {daySchedule.endTime}*/}
          {/*                      </div>*/}
          {/*                    </div>*/}
          {/*                  ) : (*/}
          {/*                    <div className="space-y-2">*/}
          {/*                      <Badge variant="outline" className="text-xs">*/}
          {/*                        Day Off*/}
          {/*                      </Badge>*/}
          {/*                      <div className="text-xs text-muted-foreground">*/}
          {/*                        No work scheduled*/}
          {/*                      </div>*/}
          {/*                    </div>*/}
          {/*                  )}*/}
          {/*                </CardContent>*/}
          {/*              </Card>*/}
          {/*            );*/}
          {/*          })}*/}
          {/*        </div>*/}
          {/*      )}*/}
          {/*    </CardContent>*/}
          {/*  </Card>*/}
          {/*</TabsContent>*/}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>{t("surveillanceOfficer.myWorkSchedule")}</CardTitle>
                <CardDescription>
                  {t("surveillanceOfficer.weeklyScheduleDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const daySchedule = schedule.find(
                        (s) => s.dayOfWeek === dayIndex,
                      );
                      return (
                        <Card key={dayIndex}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                              {getDayName(dayIndex)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {daySchedule && daySchedule.isWorkDay ? (
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-green-600">
                                  {/*<Clock className="h-3 w-3 mr-1" />*/}
                                  {t("surveillanceOfficer.workDay")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {daySchedule.startTime} -{" "}
                                  {daySchedule.endTime}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {t("surveillanceOfficer.dayOff")}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            {/*/!* Stats Cards *!/*/}
            {/*<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">*/}
            {/*  <Card>*/}
            {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
            {/*      <CardTitle className="text-sm font-medium">*/}
            {/*        Total Clients*/}
            {/*      </CardTitle>*/}
            {/*      <Users className="h-4 w-4 text-muted-foreground" />*/}
            {/*    </CardHeader>*/}
            {/*    <CardContent>*/}
            {/*      <div className="text-2xl font-bold">{clients.length}</div>*/}
            {/*    </CardContent>*/}
            {/*  </Card>*/}
            {/*  <Card>*/}
            {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
            {/*      <CardTitle className="text-sm font-medium">*/}
            {/*        High Risk Clients*/}
            {/*      </CardTitle>*/}
            {/*      <AlertTriangle className="h-4 w-4 text-red-600" />*/}
            {/*    </CardHeader>*/}
            {/*    <CardContent>*/}
            {/*      <div className="text-2xl font-bold text-red-600">*/}
            {/*        {clients.filter((c) => c.violationsCount > 5).length}*/}
            {/*      </div>*/}
            {/*    </CardContent>*/}
            {/*  </Card>*/}
            {/*  <Card>*/}
            {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
            {/*      <CardTitle className="text-sm font-medium">*/}
            {/*        Active Monitoring*/}
            {/*      </CardTitle>*/}
            {/*      <FileText className="h-4 w-4 text-green-600" />*/}
            {/*    </CardHeader>*/}
            {/*    <CardContent>*/}
            {/*      <div className="text-2xl font-bold text-green-600">*/}
            {/*        {clients.filter((c) => c.metricThreshold > 0).length}*/}
            {/*      </div>*/}
            {/*    </CardContent>*/}
            {/*  </Card>*/}
            {/*</div>*/}

            {/* Client List */}
            <Card>
              <CardHeader>
                <CardTitle>{t("surveillanceOfficer.clientList")}</CardTitle>
                <CardDescription>
                  Регистрируйте нарушения клиентов, за которыми следите
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.name")}</TableHead>
                        <TableHead>{t("table.email")}</TableHead>
                        <TableHead>
                          {t("surveillanceOfficer.violationCount")}
                        </TableHead>
                        <TableHead>
                          {t("surveillanceOfficer.metricThreshold")}
                        </TableHead>
                        {/*<TableHead>Status</TableHead>*/}
                        <TableHead>{t("table.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            {client.name} {client.surname} {client.lastname}
                          </TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                client.violationsCount > 5
                                  ? "destructive"
                                  : client.violationsCount > 2
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {client.violationsCount} {morph(client.violationsCount, ["нарушение", "нарушения", "нарушений"])}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t("table.threshold")}: {client.metricThreshold}
                            </Badge>
                          </TableCell>
                          {/*<TableCell>*/}
                          {/*  <Badge*/}
                          {/*    variant={*/}
                          {/*      client.violationsCount > 5*/}
                          {/*        ? "destructive"*/}
                          {/*        : "default"*/}
                          {/*    }*/}
                          {/*  >*/}
                          {/*    {client.violationsCount > 5*/}
                          {/*      ? "High Risk"*/}
                          {/*      : "Monitored"}*/}
                          {/*  </Badge>*/}
                          {/*</TableCell>*/}
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDetailsModal(client)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openConfirmModal(client)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                {t("surveillanceOfficer.registerViolation")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Schedule Tab */}
          <TabsContent value="monitoring-schedule">
            <Card>
              <CardHeader>
                <CardTitle>Расписание слежки за клиентами</CardTitle>
                <CardDescription>
                  Еженедельный график мониторинга по назначенным клиентам
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientMonitoringGanttCombined
                  isLoading={isLoading}
                  scheduleRefreshTrigger={scheduleRefreshTrigger}
                  groupBy="client"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ClientGeolocationModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          client={selectedClient}
        />

        {/* Confirmation Modal */}
        <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Зарегестрировать нарушение</DialogTitle>
              <DialogDescription>
                {selectedClient &&
                  `Вы уверены, что хотите зарегистрировать нарушение для ${selectedClient.surname} ${selectedClient.name} ${selectedClient.lastname}?`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cause">Причина</Label>
                <Textarea
                  id="cause"
                  placeholder="Опишите, как именно клиент нарушил отказ от вредной привычки..."
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  disabled={isSubmitting}
                  // rows={4}
                  className="w-full overflow-hidden whitespace-normal break-all"
                  maxLength={255}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Далее будет создано задание наказания, которое будет поручено сотруднику наказаний
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleRegisterPunishmentTask}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Регистрируется..." : "Зарегестрировать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
