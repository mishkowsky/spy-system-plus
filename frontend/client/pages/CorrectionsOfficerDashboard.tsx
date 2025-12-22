import React, { useState, useEffect } from "react";
import {
  PunishmentTask,
  TaskStatus,
  UpdateTaskStatusRequest,
  DeviceChangeTask,
  TimeInterval,
  Weekday,
  WorkSchedule,
} from "@/types";

import { apiClient } from "@/lib/api";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Edit,
  Eye,
  MapPin, HandFist, Monitor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/use-translation";
import TaskDetailsModal from "@/components/modals/TaskDetailsModal";
import { punishmentTypeToRu, taskStatusToRu } from "@/translations/ru.ts";

// Combined task type for unified display
type CombinedTask =
  | (PunishmentTask & { taskType: "punishment" })
  | (DeviceChangeTask & { taskType: "device-change" });

export default function CorrectionsOfficerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("tasks");
  const [tasks, setTasks] = useState<PunishmentTask[]>([]);
  const [deviceChangeTasks, setDeviceChangeTasks] = useState<
    DeviceChangeTask[]
  >([]);
  const [combinedTasks, setCombinedTasks] = useState<CombinedTask[]>([]);
  const [schedule, setSchedule] = useState<WorkSchedule[]>([]);
  const [selectedTask, setSelectedTask] = useState<CombinedTask | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] =
    useState<CombinedTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [updateData, setUpdateData] = useState<UpdateTaskStatusRequest>({
    status: TaskStatus.NEW,
  });

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
        case "tasks":
          await loadTasks();
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

  const loadTasks = async () => {
    try {
      setIsLoading(true);

      // Load both punishment tasks and device change tasks in parallel
      const [punishmentTasks, deviceChangeTasks] = await Promise.all([
        // For punishment tasks, we need to modify the API call since executionerId doesn't exist anymore
        apiClient.get<PunishmentTask[]>(
          `/punishment_tasks/filtered?assignedBy=${user?.id}`,
        ),
        apiClient.get<DeviceChangeTask[]>("/device_change_tasks"),
      ]);

      setTasks(punishmentTasks);
      setDeviceChangeTasks(deviceChangeTasks);

      // Combine tasks for unified display
      const combined: CombinedTask[] = [
        ...punishmentTasks.map((task) => ({
          ...task,
          taskType: "punishment" as const,
        })),
        ...deviceChangeTasks.map((task) => ({
          ...task,
          taskType: "device-change" as const,
        })),
      ];

      // Sort by creation date (newest first)
      combined.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setCombinedTasks(combined);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      setIsUpdating(true);

      if (selectedTask.taskType === "punishment") {
        const updatedTask = await apiClient.patch<PunishmentTask>(
          `/punishment_tasks/${selectedTask.id}`,
          updateData,
        );
        setTasks((prev) =>
          prev.map((task) =>
            task.id === selectedTask.id ? updatedTask : task,
          ),
        );
      } else {
        // For device change tasks, convert TaskStatus to DeviceChangeTaskStatus if needed
        const deviceUpdateData = {
          ...updateData,
          status: updateData.status,
        };

        const updatedTask = await apiClient.patch<DeviceChangeTask>(
          `/device_change_tasks/${selectedTask.id}`,
          deviceUpdateData,
        );
        setDeviceChangeTasks((prev) =>
          prev.map((task) =>
            task.id === selectedTask.id ? updatedTask : task,
          ),
        );
      }

      // Reload tasks to update combined list
      await loadTasks();
      setIsUpdateModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openUpdateModal = (task: CombinedTask) => {
    setSelectedTask(task);
    const taskStatus = getTaskStatus(task);
    setUpdateData({
      status: taskStatus as TaskStatus, // Cast for the form, we'll handle conversion in update
      completedAt:
        taskStatus === TaskStatus.DONE ? new Date().toISOString() : undefined,
    });
    setIsUpdateModalOpen(true);
  };

  const openDetailsModal = (task: CombinedTask) => {
    setSelectedTaskForDetails(task);
    setIsDetailsModalOpen(true);
  };

  const getStatusBadgeVariant = (status: TaskStatus) => {
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

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return <CheckCircle className="h-4 w-4" />;
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4" />;
      case TaskStatus.NEW:
        return <Calendar className="h-4 w-4" />;
      case TaskStatus.CANCELLED:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isTaskOverdue = (task: CombinedTask) => {
    // For device change tasks, check if new for over 24 hours; for punishment tasks, use 30-day rule
    if (task.taskType === "device-change") {
      return (
        new Date(Date.now() - 24 * 60 * 60 * 1000) > new Date(task.createdAt) &&
        task.status === TaskStatus.NEW
      );
    } else {
      // Punishment task - consider overdue if created more than 30 days ago and not done
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return (
        new Date(task.createdAt) < thirtyDaysAgo &&
        task.status !== TaskStatus.DONE
      );
    }
  };

  const getTaskStatus = (task: CombinedTask) => {
    if (task.taskType === "device-change") {
      return task.status;
    } else {
      return task.status;
    }
  };

  const getTaskStats = () => {
    const total = combinedTasks.length;
    const done = combinedTasks.filter((t) => {
      const status = getTaskStatus(t);
      return status === TaskStatus.DONE;
    }).length;
    const inProgress = combinedTasks.filter((t) => {
      const status = getTaskStatus(t);
      return status === TaskStatus.IN_PROGRESS;
    }).length;
    const pending = combinedTasks.filter((t) => {
      const status = getTaskStatus(t);
      return status === TaskStatus.NEW;
    }).length;
    const failed = combinedTasks.filter((t) => {
      const status = getTaskStatus(t);
      return status === TaskStatus.CANCELLED;
    }).length;
    const overdue = combinedTasks.filter((t) => isTaskOverdue(t)).length;

    return { total, done, inProgress, newTasks: pending, overdue };
  };

  const stats =
    activeTab === "tasks"
      ? getTaskStats()
      : { total: 0, done: 0, inProgress: 0, newTasks: 0, overdue: 0 };

  const filterTasksByStatus = (status?: TaskStatus) => {
    if (!status) return combinedTasks;
    return combinedTasks.filter((task) => getTaskStatus(task) === status);
  };

  const getTasksByStatus = () => {
    return {
      new: combinedTasks.filter((task) => {
        return task.status === TaskStatus.NEW;
      }),
      inProgress: combinedTasks.filter((task) => {
        return task.status === TaskStatus.IN_PROGRESS;
      }),
      done: combinedTasks.filter((task) => {
        return task.status === TaskStatus.DONE;
      }),
      cancelled: combinedTasks.filter((task) => {
        return task.status === TaskStatus.CANCELLED;
      }),
      overdue: combinedTasks.filter((t) => isTaskOverdue(t)),
    };
  };

  const tasksByStatus =
    activeTab === "tasks"
      ? getTasksByStatus()
      : { new: [], inProgress: [], done: [], cancelled: [] };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Main Tabs */}
        {/*<Tabs value={activeTab} onValueChange={setActiveTab}>*/}
        {/*  <TabsList className="grid w-full grid-cols-2">*/}
        {/*    <TabsTrigger value="schedule" className="flex items-center gap-2">*/}
        {/*      <Calendar className="h-4 w-4" />*/}
        {/*      My Schedule*/}
        {/*    </TabsTrigger>*/}
        {/*    <TabsTrigger value="tasks" className="flex items-center gap-2">*/}
        {/*      <CheckCircle className="h-4 w-4" />*/}
        {/*      Tasks ({stats.total})*/}
        {/*    </TabsTrigger>*/}
        {/*  </TabsList>*/}

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
        {/*        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">*/}
        {/*          {Array.from({ length: 7 }, (_, dayIndex) => {*/}
        {/*            const daySchedule = schedule.find(*/}
        {/*              (s) => s.dayOfWeek === dayIndex,*/}
        {/*            );*/}
        {/*            return (*/}
        {/*              <Card key={dayIndex}>*/}
        {/*                <CardHeader className="pb-2">*/}
        {/*                  <CardTitle className="text-sm">*/}
        {/*                    {getDayName(dayIndex)}*/}
        {/*                  </CardTitle>*/}
        {/*                </CardHeader>*/}
        {/*                <CardContent>*/}
        {/*                  {daySchedule && daySchedule.isWorkDay ? (*/}
        {/*                    <div className="space-y-2">*/}
        {/*                      <div className="flex items-center text-sm text-green-600">*/}
        {/*                        <Clock className="h-3 w-3 mr-1" />*/}
        {/*                        Work Day*/}
        {/*                      </div>*/}
        {/*                      <div className="text-xs text-muted-foreground">*/}
        {/*                        {daySchedule.startTime} -{" "}*/}
        {/*                        {daySchedule.endTime}*/}
        {/*                      </div>*/}
        {/*                    </div>*/}
        {/*                  ) : (*/}
        {/*                    <div className="text-sm text-muted-foreground">*/}
        {/*                      Day Off*/}
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

        {/* Tasks Tab */}
        {/*<TabsContent value="tasks">*/}
        {/*/!* Stats Cards *!/*/}
        {/*<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">*/}
        {/*  <Card>*/}
        {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
        {/*      <CardTitle className="text-sm font-medium">*/}
        {/*        Total Tasks*/}
        {/*      </CardTitle>*/}
        {/*      <Calendar className="h-4 w-4 text-muted-foreground" />*/}
        {/*    </CardHeader>*/}
        {/*    <CardContent>*/}
        {/*      <div className="text-2xl font-bold">{stats.total}</div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*  <Card>*/}
        {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
        {/*      <CardTitle className="text-sm font-medium">New</CardTitle>*/}
        {/*      <Calendar className="h-4 w-4 text-blue-500" />*/}
        {/*    </CardHeader>*/}
        {/*    <CardContent>*/}
        {/*      <div className="text-2xl font-bold text-blue-500">*/}
        {/*        {stats.newTasks}*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*  <Card>*/}
        {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
        {/*      <CardTitle className="text-sm font-medium">*/}
        {/*        In Progress*/}
        {/*      </CardTitle>*/}
        {/*      <Clock className="h-4 w-4 text-yellow-600" />*/}
        {/*    </CardHeader>*/}
        {/*    <CardContent>*/}
        {/*      <div className="text-2xl font-bold text-yellow-600">*/}
        {/*        {stats.inProgress}*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*  <Card>*/}
        {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
        {/*      <CardTitle className="text-sm font-medium">Done</CardTitle>*/}
        {/*      <CheckCircle className="h-4 w-4 text-green-600" />*/}
        {/*    </CardHeader>*/}
        {/*    <CardContent>*/}
        {/*      <div className="text-2xl font-bold text-green-600">*/}
        {/*        {stats.done}*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*  <Card>*/}
        {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
        {/*      <CardTitle className="text-sm font-medium">Overdue</CardTitle>*/}
        {/*      <AlertTriangle className="h-4 w-4 text-red-600" />*/}
        {/*    </CardHeader>*/}
        {/*    <CardContent>*/}
        {/*      <div className="text-2xl font-bold text-red-600">*/}
        {/*        {stats.overdue}*/}
        {/*      </div>*/}
        {/*    </CardContent>*/}
        {/*  </Card>*/}
        {/*</div>*/}

        {/* Main Content */}
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              {t("taskManagement.allTasks")} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="new">
              {t("taskManagement.new")} ({tasksByStatus.new.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              {t("taskManagement.inProgress")} (
              {tasksByStatus.inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="done">
              {t("taskManagement.done")} ({tasksByStatus.done.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              {t("status.cancelled")} ({tasksByStatus.cancelled.length})
            </TabsTrigger>
          </TabsList>

          {/* All Tasks Tab */}
          <TabsContent value="all">
            <TaskTable
              tasks={combinedTasks}
              onUpdateTask={openUpdateModal}
              onViewTask={openDetailsModal}
            />
          </TabsContent>

          {/* New Tasks Tab */}
          <TabsContent value="new">
            <TaskTable
              tasks={tasksByStatus.new}
              onUpdateTask={openUpdateModal}
              onViewTask={openDetailsModal}
            />
          </TabsContent>

          {/* In Progress Tasks Tab */}
          <TabsContent value="in-progress">
            <TaskTable
              tasks={tasksByStatus.inProgress}
              onUpdateTask={openUpdateModal}
              onViewTask={openDetailsModal}
            />
          </TabsContent>

          {/* Done Tasks Tab */}
          <TabsContent value="done">
            <TaskTable
              tasks={tasksByStatus.done}
              onUpdateTask={openUpdateModal}
              onViewTask={openDetailsModal}
            />
          </TabsContent>

          <TabsContent value="cancelled">
            <TaskTable
              tasks={tasksByStatus.cancelled}
              onUpdateTask={openUpdateModal}
              onViewTask={openDetailsModal}
            />
          </TabsContent>
        </Tabs>

        {/* Update Task Modal */}
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("taskManagement.updateTaskStatus")}</DialogTitle>
              <DialogDescription>
                {selectedTask &&
                  (selectedTask.taskType === "device-change"
                    ? t("taskManagement.updateDeviceChangeTask", {
                        id: selectedTask.id.toString(),
                      })
                    : t("taskManagement.updatePunishmentTask", {
                        id: selectedTask.id.toString(),
                        title: selectedTask.title,
                      }))}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t("misc.status")}</Label>
                <Select
                  value={updateData.status}
                  onValueChange={(value) =>
                    setUpdateData({
                      ...updateData,
                      status: value as TaskStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>
                      {t("status.inProgress")}
                    </SelectItem>
                    <SelectItem value={TaskStatus.DONE}>
                      {t("status.done")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("taskManagement.taskInformation")}</Label>
                <div className="text-sm text-muted-foreground">
                  <div>
                    {t("taskManagement.client")}:{" "}
                    {selectedTask?.client
                      ? `${selectedTask.client.surname} ${selectedTask.client.name} ${selectedTask.client.lastname} (ID: ${selectedTask.client.id})`
                      : `${t("taskManagement.clientId")}: ${selectedTask?.client.id}`}
                  </div>
                  {selectedTask?.taskType === "device-change" &&
                    selectedTask?.oldDeviceId && (
                      <div>
                        {t("taskManagement.oldDevice")}: #
                        {selectedTask.oldDeviceId}
                      </div>
                    )}
                  {selectedTask?.taskType === "device-change" &&
                    selectedTask?.newDeviceId && (
                      <div>
                        {t("taskManagement.newDevice")}: #
                        {selectedTask.newDeviceId}
                      </div>
                    )}
                  <div>
                    {t("taskManagement.created")}:{" "}
                    {selectedTask?.createdAt
                      ? new Date(selectedTask.createdAt).toLocaleDateString()
                      : t("taskManagement.notAvailable")}
                  </div>
                </div>
              </div>
              {updateData.status === TaskStatus.DONE && (
                <div className="space-y-2">
                  <Label>{t("taskManagement.doneDate")}</Label>
                  <div className="text-sm text-muted-foreground">
                    {t("taskManagement.thisTaskWillBeMarkedAsCompletedOn")}{" "}
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleUpdateTask}
                disabled={isUpdating}
              >
                {isUpdating
                  ? t("taskManagement.updating")
                  : t("taskManagement.updateStatus")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/*</TabsContent>*/}
        {/*</Tabs>*/}
      </div>

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        task={selectedTaskForDetails}
      />
    </Layout>
  );
}

// Task Table Component
function TaskTable({
  tasks,
  onUpdateTask,
  onViewTask,
}: {
  tasks: CombinedTask[];
  onUpdateTask: (task: CombinedTask) => void;
  onViewTask: (task: CombinedTask) => void;
}) {
  const { t } = useTranslation();
  const getStatusBadgeVariant = (status: TaskStatus) => {
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

  const calculateProgress = (task: CombinedTask) => {
    const status =
      task.taskType === "device-change" ? task.status : task.status;
    // Progress based on status
    if (status === TaskStatus.DONE) return 100;
    if (status === TaskStatus.IN_PROGRESS) return 50;
    if (status === TaskStatus.CANCELLED) return 0;
    return 0; // PENDING
  };

  const getTaskTypeDisplay = (task: CombinedTask) => {
    if (task.taskType === "device-change") {
      return t("taskManagement.deviceChange");
    } else {
      return t("taskManagement.punishmentTask");
    }
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
      // Punishment task - consider overdue if created more than 30 days ago and not done
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return (
        new Date(task.createdAt) < thirtyDaysAgo &&
        task.status !== TaskStatus.DONE
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("taskManagement.tasks")}</CardTitle>
        <CardDescription>
          {t("taskManagement.monitorAndUpdate")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("taskManagement.noTasksFound")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("taskManagement.task")}</TableHead>
                <TableHead>{t("taskManagement.client")}</TableHead>
                <TableHead>Детали</TableHead>
                <TableHead>{t("misc.status")}</TableHead>
                <TableHead>{t("taskManagement.created")}</TableHead>
                <TableHead>{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={`${task.taskType}-${task.id}`}>
                  <TableCell>
                    <Badge variant="outline" className={"flex: inner-display gap-2"}>
                      {task.taskType == "punishment" ? (<HandFist className={"w-4 h-4"}/>) : (<Monitor className={"w-4 h-4"}/>)}
                      {getTaskTypeDisplay(task)} #{task.id}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {task.client ? (
                        <div className="font-medium">
                          {task.client.surname} {task.client.name[0]}{". "}
                          {task.client.lastname[0]}{"."}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          Client {task.clientId}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.taskType === "device-change" ? (
                      <div className="text-sm">
                        <div className="font-medium">Замена:</div>
                        <div className="text-xs text-muted-foreground">
                          {task.oldDevice?.deviceId ||
                            `ID: ${task.oldDeviceId}`}{" "}
                          →{" "}
                          {task.newDevice?.deviceId ||
                            `ID: ${task.newDeviceId}`}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div className="font-medium">Тип наказания:</div>
                        <div className="text-xs text-muted-foreground">
                          {punishmentTypeToRu(task.type)}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(task.status)}>
                      {taskStatusToRu(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(task.createdAt)}
                    {task.taskType === "device-change" && task.doneAt && (
                      <div className="text-xs text-green-600">
                        {t("taskManagement.done")}: {formatDate(task.doneAt)}
                      </div>
                    )}
                    {task.taskType === "punishment" && task.completedAt && (
                      <div className="text-xs text-green-600">
                        {t("taskManagement.completed")}:{" "}
                        {formatDate(task.completedAt)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewTask(task)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {task.status != TaskStatus.CANCELLED &&
                        task.status != TaskStatus.DONE && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUpdateTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
