import React, { useState, useEffect } from "react";
import {
  Client,
  Contract,
  Device,
  Employee,
  WorkSchedule,
  ContractStatus,
  UpdateContractStatusRequest,
  Worker,
  WorkerRole,
  Manager,
  TimeInterval,
  Weekday,
  UserRole,
  Metric,
  PunishmentTask,
  TaskStatus,
  DeviceChangeTask,
} from "@/types";
import { apiClient } from "@/lib/api";
import { BatteryIndicator } from "@/components/ui/battery-indicator";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Calendar,
  Users,
  FileText,
  Monitor,
  Clock,
  Edit,
  Eye,
  CheckCircle,
  Settings,
  Plus,
  Activity,
  RefreshCw,
  X,
  MapPin as MapIcon,
  Trash2,
  HandFist,
} from "lucide-react";
import EChartsReact from "echarts-for-react";
import { useAuth } from "@/contexts/AuthContext";
import { ClientThresholdModal } from "@/components/modals/ClientThresholdModal";
import { RegisterDeviceModal } from "@/components/modals/RegisterDeviceModal";
import TaskDetailsModal from "@/components/modals/TaskDetailsModal";
import DeviceDetailsModal from "@/components/modals/DeviceDetailsModal";
import DeviceReplacementModal from "@/components/modals/DeviceReplacementModal";
import { ClientMonitoringScheduleModal } from "@/components/modals/ClientMonitoringScheduleModal";
import { ClientMonitoringGanttByWorker } from "@/components/ClientMonitoringGanttByWorker";
import GeolocationMap from "@/components/GeolocationMap.tsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ClientMonitoringGanttCombined } from "@/components/ClientMonitoringGanttCombined.tsx";
import { useTranslation } from "@/hooks/use-translation";
import {
  contractStatusToRu,
  deviceAssignmentStatusToRu,
  deviceStatusToRu,
  emplyeeRoleToRu,
  morph,
  punishmentTypeToRu,
  taskStatusToRu,
} from "@/translations/ru.ts";

// Combined task type for unified display
type CombinedTask =
  | (PunishmentTask & { taskType: "punishment" })
  | (DeviceChangeTask & { taskType: "device-change" });

const createAccountSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "First name is required"),
  surname: z.string().min(1, "Last name is required"),
  lastname: z.string().min(1, "Middle name is required"),
  accountType: z.enum([
    "employee-corrections",
    "employee-surveillance",
    "manager",
  ]),
  isSenior: z.boolean().optional(),
});

type CreateAccountFormValues = z.infer<typeof createAccountSchema>;

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("clients");
  const [schedule, setSchedule] = useState<WorkSchedule[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
  const [employeeSchedule, setEmployeeSchedule] = useState<TimeInterval[]>([]);
  const [scheduleError, setScheduleError] = useState("");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null,
  );
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [editContractDetails, setEditContractDetails] = useState("");
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] =
    useState(false);
  const [selectedClientForDetails, setSelectedClientForDetails] =
    useState<Client | null>(null);
  const [clientMetrics, setClientMetrics] = useState<Metric[]>([]);
  const [allClientMetrics, setAllClientMetrics] = useState<Metric[]>([]);
  const [clientMetricsTimeInterval, setClientMetricsTimeInterval] = useState<
    "5m" | "30m" | "1h" | "1d"
  >("1h");
  const [clientTasks, setClientTasks] = useState<PunishmentTask[]>([]);
  const [isLoadingClientDetails, setIsLoadingClientDetails] = useState(false);
  const [devicesMap, setDevicesMap] = useState<{ [id: number]: Device }>({});
  const [latestClientMetric, setLatestClientMetric] = useState<Metric | null>(
    null,
  );
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] =
    useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isRegisterDeviceModalOpen, setIsRegisterDeviceModalOpen] =
    useState(false);
  const [allTasks, setAllTasks] = useState<PunishmentTask[]>([]);
  const [allDeviceChangeTasks, setAllDeviceChangeTasks] = useState<
    DeviceChangeTask[]
  >([]);
  const [allCombinedTasks, setAllCombinedTasks] = useState<CombinedTask[]>([]);
  const [isTaskDetailsModalOpen, setIsTaskDetailsModalOpen] = useState(false);
  const [selectedTaskForDetails, setSelectedTaskForDetails] =
    useState<CombinedTask | null>(null);
  const [isDeviceDetailsModalOpen, setIsDeviceDetailsModalOpen] =
    useState(false);
  const [selectedDeviceForDetails, setSelectedDeviceForDetails] =
    useState<Device | null>(null);
  const [isDeviceReplacementModalOpen, setIsDeviceReplacementModalOpen] =
    useState(false);
  const [selectedDeviceForReplacement, setSelectedDeviceForReplacement] =
    useState<Device | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [cancellingTaskId, setCancellingTaskId] = useState<number | null>(null);
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);
  const [allManagers, setAllManagers] = useState<Manager[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [unassignedWorkers, setUnassignedWorkers] = useState<Worker[]>([]);
  const [assigningWorkerId, setAssigningWorkerId] = useState<number | null>(
    null,
  );
  const [isMonitoringScheduleModalOpen, setIsMonitoringScheduleModalOpen] =
    useState(false);
  const [selectedClientForMonitoring, setSelectedClientForMonitoring] =
    useState<Client | null>(null);
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);
  const [deviceDetailsRefreshTrigger, setDeviceDetailsRefreshTrigger] =
    useState(0);
  const [reassignmentError, setReassignmentError] = useState<string | null>(
    null,
  );

  const createAccountForm = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      email: "",
      name: "",
      surname: "",
      lastname: "",
      accountType: "employee-corrections",
      isSenior: false,
    },
  });

  useEffect(() => {
    loadData();
  }, [activeTab, user?.id]);

  useEffect(() => {
    const loadCurrentManager = async () => {
      if (user?.id) {
        try {
          const manager = await apiClient.get<Manager>(`/managers/${user.id}`);
          setCurrentManager(manager);
        } catch (error) {
          console.error("Failed to load current manager:", error);
          setCurrentManager(null);
        }
      }
    };

    loadCurrentManager();
  }, [user?.id]);

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
        case "contracts":
          await loadContracts();
          break;
        case "employees":
          await loadEmployees();
          break;
        case "devices":
          await loadDevices();
          break;
        case "tasks":
          await loadAllTasks();
          break;
        case "staff-relationships":
          await loadStaffRelationships();
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

  const openContractModal = (contract: Contract) => {
    setSelectedContract(contract);
    setEditContractDetails(contract.clientDetails || "");
    setIsEditingContract(false);
    setIsContractModalOpen(true);
  };

  const updateContractDetails = async () => {
    if (!selectedContract) return;

    try {
      const updatedContract = await apiClient.patch<Contract>(
        `/contracts/${selectedContract.id}`,
        { clientDetails: editContractDetails },
      );

      // Update the contract in the local state
      setContracts((prev) =>
        prev.map((contract) =>
          contract.id === selectedContract.id ? updatedContract : contract,
        ),
      );

      setSelectedContract(updatedContract);
      setIsEditingContract(false);
    } catch (error) {
      console.error("Failed to update contract details:", error);
    }
  };

  const downloadContractFile = async (contract: Contract) => {
    try {
      const blob = await apiClient.downloadFile(
        `/files/download?filepath=${encodeURIComponent(contract.filepath)}`,
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = contract.filepath.split("/").pop() || "contract-file";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const openClientDetailsModal = async (client: Client) => {
    setSelectedClientForDetails(client);
    setIsClientDetailsModalOpen(true);
    setIsLoadingClientDetails(true);
    setClientMetricsTimeInterval("1h");

    try {
      // Get all devices assigned to this client
      const devices = await apiClient.get<Device[]>(
        `/devices/filtered?assignedClientId=${client.id}`,
      );

      // Build device map
      const deviceMap: { [id: number]: Device } = {};
      devices.forEach((device) => {
        deviceMap[device.id] = device;
      });
      setDevicesMap(deviceMap);

      // Fetch all metrics for this client
      const metrics = await apiClient.get<Metric[]>(
        `/metrics/filtered?clientId=${client.id}`,
      );

      // Sort metrics by timestamp in ascending order
      const sortedMetrics = [...metrics].sort((a, b) => {
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });

      setAllClientMetrics(sortedMetrics);
      setClientMetrics(sortedMetrics);

      // Fetch latest metric for geolocation
      try {
        const latestMetric = await apiClient.get<Metric>(
          `/clients/${client.id}/metrics/latest`,
        );
        console.log(latestMetric);
        setLatestClientMetric(latestMetric);
      } catch (geoError) {
        console.error(
          "Failed to load latest metric for geolocation:",
          geoError,
        );
        setLatestClientMetric(null);
      }

      // Fetch client punishment tasks
      const tasks = await apiClient.get<PunishmentTask[]>(
        `/punishment_tasks/filtered?clientId=${client.id}`,
      );
      setClientTasks(tasks);
    } catch (error) {
      console.error("Failed to load client details:", error);
      setClientMetrics([]);
      setAllClientMetrics([]);
      setClientTasks([]);
      setDevicesMap({});
      setLatestClientMetric(null);
    } finally {
      setIsLoadingClientDetails(false);
    }
  };

  const closeClientDetailsModal = () => {
    setIsClientDetailsModalOpen(false);
    setSelectedClientForDetails(null);
    setClientMetrics([]);
    setAllClientMetrics([]);
    setClientTasks([]);
    setDevicesMap({});
    setLatestClientMetric(null);
  };

  const loadSchedule = async () => {
    try {
      // Use time_intervals filtered endpoint for this manager
      const intervals = await apiClient.get<TimeInterval[]>(
        `/time_intervals/filtered?managerId=${user?.id}`,
      );
      // Convert TimeInterval to WorkSchedule format for compatibility
      const schedule: WorkSchedule[] = intervals.map((interval) => ({
        id: interval.id.toString(),
        employeeId: interval.managerId.toString(),
        dayOfWeek: convertWeekdayToNumber(interval.weekday),
        // Parse HH:MM:SS format to HH:MM
        startTime: interval.begin.substring(0, 5),
        endTime: interval.ending.substring(0, 5),
        isWorkDay: true,
      }));
      setSchedule(schedule);
    } catch (error) {
      console.error("Failed to load schedule:", error);
    }
  };

  const convertWeekdayToNumber = (weekday: Weekday): number => {
    switch (weekday) {
      case Weekday.MONDAY:
        return 0;
      case Weekday.TUESDAY:
        return 1;
      case Weekday.WEDNESDAY:
        return 2;
      case Weekday.THURSDAY:
        return 3;
      case Weekday.FRIDAY:
        return 4;
      case Weekday.SATURDAY:
        return 5;
      case Weekday.SUNDAY:
        return 6;
      default:
        return 1;
    }
  };

  const loadClients = async () => {
    try {
      const clients = await apiClient.get<Client[]>("/clients");
      setClients(clients);
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
  };

  const loadContracts = async () => {
    try {
      // Use filtered contracts endpoint to get contracts for this manager
      const contracts = await apiClient.get<Contract[]>(
        `/contracts/filtered?signerId=${user?.id}`,
      );
      setContracts(contracts);
    } catch (error) {
      console.error("Failed to load contracts:", error);
    }
  };

  const loadDevices = async () => {
    try {
      const devices = await apiClient.get<Device[]>("/devices");
      setDevices(devices);
    } catch (error) {
      console.error("Failed to load devices:", error);
    }
  };

  const loadAllTasks = async () => {
    try {
      // Load all punishment tasks, device change tasks, and workers data
      const [punishmentTasks, deviceChangeTasks, workersData] =
        await Promise.all([
          apiClient.get<PunishmentTask[]>("/punishment_tasks"),
          apiClient.get<DeviceChangeTask[]>("/device_change_tasks"),
          apiClient.get<Worker[]>("/workers"),
        ]);

      setAllTasks(punishmentTasks);
      setAllDeviceChangeTasks(deviceChangeTasks);
      setWorkers(workersData);

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

      setAllCombinedTasks(combined);
    } catch (error) {
      console.error("Failed to load all tasks:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      // Load both workers and managers
      const [workers, managers] = await Promise.all([
        apiClient.get<Worker[]>("/workers"),
        apiClient.get<Manager[]>("/managers"),
      ]);

      // Convert Workers to Employee format
      const workerEmployees: Employee[] = workers.map((worker) => ({
        id: `worker-${worker.id}`,
        firstName: worker.name,
        lastName: worker.lastname,
        surname: worker.surname,
        email: worker.email,
        role:
          worker.role === WorkerRole.SURVEILLANCE_OFFICER
            ? UserRole.SURVEILLANCE_OFFICER
            : UserRole.CORRECTIONS_OFFICER,
        managerId: user?.id,
        schedule: [],
      }));

      // Convert Managers to Employee format
      const managerEmployees: Employee[] = managers.map((manager) => ({
        id: `manager-${manager.id}`,
        firstName: manager.name,
        lastName: manager.lastname,
        surname: manager.surname,
        email: manager.email,
        role: manager.isSenior ? UserRole.SENIOR_MANAGER : UserRole.MANAGER,
        managerId: user?.id,
        schedule: [],
      }));

      // Combine workers and managers
      const allEmployees = [...workerEmployees, ...managerEmployees];
      setEmployees(allEmployees);
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  const createAccount = async (values: CreateAccountFormValues) => {
    setIsCreatingAccount(true);
    try {
      if (values.accountType === "manager") {
        const managerData = {
          email: values.email,
          name: values.name,
          surname: values.surname,
          lastname: values.lastname,
          isSenior: values.isSenior || false,
        };

        await apiClient.post("/managers", managerData);
      } else {
        const workerRole =
          values.accountType === "employee-corrections"
            ? "CORRECTIONS_OFFICER"
            : "SURVEILLANCE_OFFICER";

        const workerData = {
          email: values.email,
          name: values.name,
          surname: values.surname,
          lastname: values.lastname,
          role: workerRole,
        };

        await apiClient.post("/workers", workerData);
      }

      // Reload employees if we're on the employees tab
      if (activeTab === "employees") {
        await loadEmployees();
      }

      // Reset form and close modal
      createAccountForm.reset();
      setIsCreateAccountModalOpen(false);
    } catch (error: any) {
      console.error("Failed to create account:", error);

      // Handle specific error cases
      if (error.response?.status === 409) {
        // Email already exists
        createAccountForm.setError("email", {
          type: "manual",
          message: t("register.accountExists"),
        });
      } else if (error.response?.data?.error) {
        // Server provided a specific error message
        createAccountForm.setError("root", {
          type: "manual",
          message: error.response.data.error,
        });
      } else {
        // Generic error
        createAccountForm.setError("root", {
          type: "manual",
          message: error.message || t("register.registrationFailed"),
        });
      }
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const openTaskDetailsModal = (task: CombinedTask) => {
    setSelectedTaskForDetails(task);
    setIsTaskDetailsModalOpen(true);
  };

  const handleCancelTask = async (task: CombinedTask) => {
    setCancellingTaskId(task.id);
    try {
      if (task.taskType === "device-change") {
        await apiClient.patch(`/device_change_tasks/${task.id}`, {
          status: TaskStatus.CANCELLED,
        });

        // Update the combined tasks list
        setAllCombinedTasks((prev) =>
          prev.map((t) =>
            t.id === task.id && t.taskType === "device-change"
              ? { ...t, status: TaskStatus.CANCELLED }
              : t,
          ),
        );

        // Update the device change tasks list
        setAllDeviceChangeTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: TaskStatus.CANCELLED } : t,
          ),
        );
      } else if (task.taskType === "punishment") {
        await apiClient.patch(`/punishment_tasks/${task.id}`, {
          status: TaskStatus.CANCELLED,
        });

        // Update the combined tasks list
        setAllCombinedTasks((prev) =>
          prev.map((t) =>
            t.id === task.id && t.taskType === "punishment"
              ? { ...t, status: TaskStatus.CANCELLED }
              : t,
          ),
        );

        // Update the punishment tasks list
        setAllTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, status: TaskStatus.CANCELLED } : t,
          ),
        );
      }

      // Close the task details modal after successful cancellation
      setIsTaskDetailsModalOpen(false);
      setSelectedTaskForDetails(null);
    } catch (error) {
      console.error("Failed to cancel task:", error);
    } finally {
      setCancellingTaskId(null);
    }
  };

  const openDeviceDetailsModal = (device: Device) => {
    setSelectedDeviceForDetails(device);
    setIsDeviceDetailsModalOpen(true);
  };

  const openDeviceReplacementModal = (device: Device) => {
    setSelectedDeviceForReplacement(device);
    setIsDeviceReplacementModalOpen(true);
  };

  const handleReplacementSuccess = () => {
    // Reload devices data after successful replacement task creation
    if (activeTab === "devices") {
      loadDevices();
    }
    // Refresh device details modal to show updated device info
    setDeviceDetailsRefreshTrigger((prev) => prev + 1);
  };

  const sendContractToClient = async (contractId: string) => {
    try {
      const updateRequest: UpdateContractStatusRequest = {
        status: ContractStatus.SEND_TO_CLIENT,
      };
      await apiClient.patch(`/contracts/${contractId}`, updateRequest);
      await loadContracts();
    } catch (error) {
      console.error("Failed to send contract to client:", error);
    }
  };

  const loadStaffRelationships = async () => {
    try {
      const [currentManagerData, managersData, workersData] = await Promise.all(
        [
          apiClient.get<Manager>(`/managers/${user?.id}`),
          apiClient.get<Manager[]>("/managers"),
          apiClient.get<Worker[]>("/workers/all"),
        ],
      );

      setCurrentManager(currentManagerData);
      setAllManagers(managersData);
      setAllWorkers(workersData);

      const unassigned = workersData.filter((w) => !w.manager);
      setUnassignedWorkers(unassigned);
    } catch (error) {
      console.error("Failed to load staff relationships:", error);
      setCurrentManager(null);
      setAllManagers([]);
      setAllWorkers([]);
      setUnassignedWorkers([]);
    }
  };

  const handleAssignWorker = async (workerId: number, managerId: number) => {
    setAssigningWorkerId(workerId);
    try {
      await apiClient.patch(`/workers/${workerId}`, { managerId });

      // Find the manager object to set in the worker
      const manager = allManagers.find((m) => m.id === managerId);

      setAllWorkers((prev) =>
        prev.map((w) =>
          w.id === workerId ? { ...w, managerId, manager: manager || null } : w,
        ),
      );
      setUnassignedWorkers((prev) => prev.filter((w) => w.id !== workerId));
    } catch (error) {
      console.error("Failed to assign worker:", error);
    } finally {
      setAssigningWorkerId(null);
    }
  };

  const handleReassignWorker = async (
    workerId: number,
    newManagerId: number,
  ) => {
    setAssigningWorkerId(workerId);
    setReassignmentError(null);
    try {
      await apiClient.patch(`/workers/${workerId}`, {
        managerId: newManagerId,
      });

      const newManager = allManagers.find((m) => m.id === newManagerId);
      const updatedWorker = allWorkers.find((w) => w.id === workerId);

      if (updatedWorker && newManager) {
        const reassignedWorker = {
          ...updatedWorker,
          managerId: newManagerId,
          manager: newManager,
        };
        setAllWorkers((prev) =>
          prev.map((w) => (w.id === workerId ? reassignedWorker : w)),
        );
      }
    } catch (error: any) {
      let errorMessage = t("error.tryAgain");

      if (error.response?.status === 409) {
        if (
          error.response?.data?.error?.includes("monitoring schedule") ||
          error.response?.data?.message?.includes("monitoring schedule") ||
          error.message?.includes("monitoring schedule")
        ) {
          errorMessage = t("error.cantReassignWorker");
        }
      }

      setReassignmentError(errorMessage);
      console.error("Failed to reassign worker:", error);
    } finally {
      setAssigningWorkerId(null);
    }
  };

  const openClientModal = (client: Client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleClientUpdated = (updatedClient: Client) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id === updatedClient.id ? updatedClient : client,
      ),
    );
    setSelectedClient(updatedClient);
  };

  const handleDeviceCreated = (newDevice: Device) => {
    setDevices((prev) => [...prev, newDevice]);
  };

  const openScheduleModal = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsScheduleModalOpen(true);
    try {
      // Extract the actual worker ID from the prefixed ID
      const actualWorkerId =
        employee.id.startsWith("worker-") || employee.id.startsWith("manager-")
          ? employee.id.split("-")[1]
          : employee.id;

      // Load employee's current schedule
      const intervals = await apiClient.get<TimeInterval[]>(
        `/time_intervals/filtered?workerId=${actualWorkerId}`,
      );
      setEmployeeSchedule(intervals);
    } catch (error) {
      console.error("Failed to load employee schedule:", error);
      // Initialize with empty schedule for 7 days
      setEmployeeSchedule([]);
    }
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSelectedEmployee(null);
    setEmployeeSchedule([]);
    setScheduleError("");
  };

  const getWeekdays = (): { key: Weekday; label: string; number: number }[] => [
    { key: Weekday.MONDAY, label: "Monday", number: 0 },
    { key: Weekday.TUESDAY, label: "Tuesday", number: 1 },
    { key: Weekday.WEDNESDAY, label: "Wednesday", number: 2 },
    { key: Weekday.THURSDAY, label: "Thursday", number: 3 },
    { key: Weekday.FRIDAY, label: "Friday", number: 4 },
    { key: Weekday.SATURDAY, label: "Saturday", number: 5 },
    { key: Weekday.SUNDAY, label: "Sunday", number: 6 },
  ];

  const getScheduleForDay = (weekday: Weekday): TimeInterval | null => {
    return (
      employeeSchedule.find((interval) => interval.weekday === weekday) || null
    );
  };

  const updateDaySchedule = (
    weekday: Weekday,
    isWorkDay: boolean,
    startTime?: string,
    endTime?: string,
  ) => {
    const existingInterval = getScheduleForDay(weekday);

    if (!isWorkDay) {
      // Remove the interval if it exists
      setEmployeeSchedule((prev) =>
        prev.filter((interval) => interval.weekday !== weekday),
      );
      return;
    }

    // Use HH:MM:SS format for time strings
    const beginTime = startTime ? `${startTime}:00` : "09:00:00";
    const endingTime = endTime ? `${endTime}:00` : "17:00:00";

    // Extract the actual worker ID from the prefixed ID
    const actualWorkerId =
      selectedEmployee?.id.startsWith("worker-") ||
      selectedEmployee?.id.startsWith("manager-")
        ? selectedEmployee.id.split("-")[1]
        : selectedEmployee?.id || "0";

    const newInterval: TimeInterval = {
      id: existingInterval?.id || 0, // Will be removed for POST requests
      workerId: parseInt(actualWorkerId),
      managerId: parseInt(user?.id || "0"),
      weekday,
      begin: beginTime,
      ending: endingTime,
    };

    setEmployeeSchedule((prev) => {
      const filtered = prev.filter((interval) => interval.weekday !== weekday);
      return [...filtered, newInterval];
    });
  };
  const saveSchedule = async () => {
    if (!selectedEmployee) return;

    setIsUpdatingSchedule(true);
    setScheduleError("");

    try {
      // Validate schedule before saving
      const hasInvalidTimes = employeeSchedule.some((interval) => {
        // Parse HH:MM:SS format for comparison
        const startParts = interval.begin.split(":");
        const endParts = interval.ending.split(":");
        const startMinutes =
          parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        return startMinutes >= endMinutes;
      });

      if (hasInvalidTimes) {
        setScheduleError(
          "Invalid time range: End time must be after start time",
        );
        return;
      }

      // Extract the actual worker ID from the prefixed ID
      const actualWorkerId =
        selectedEmployee.id.startsWith("worker-") ||
        selectedEmployee.id.startsWith("manager-")
          ? selectedEmployee.id.split("-")[1]
          : selectedEmployee.id;

      // Delete existing intervals for this worker
      const existingIntervals = await apiClient.get<TimeInterval[]>(
        `/time_intervals/filtered?workerId=${actualWorkerId}`,
      );
      for (const interval of existingIntervals) {
        await apiClient.delete(`/time_intervals/${interval.id}`);
      }

      // Create new intervals (remove ID and managerId for POST requests)
      for (const interval of employeeSchedule) {
        const { id, managerId, ...intervalData } = interval;
        await apiClient.post<TimeInterval>("/time_intervals", intervalData);
      }

      closeScheduleModal();
      await loadEmployees(); // Refresh the employee list
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : "Failed to save schedule",
      );
      console.error("Failed to save schedule:", error);
    } finally {
      setIsUpdatingSchedule(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return days[dayOfWeek];
  };

  const getContractStatusBadgeVariant = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.SIGNED:
        return "default";
      case ContractStatus.SEND_TO_CLIENT:
      case ContractStatus.CREATED:
        return "outline";
      case ContractStatus.OUTDATED:
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return (
      new Date(dateString).toLocaleTimeString() + " " + formatDate(dateString)
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList
            className={`grid w-full ${currentManager?.isSenior ? "grid-cols-7" : "grid-cols-6"}`}
          >
            {/*<TabsTrigger value="schedule" className="flex items-center gap-2">*/}
            {/*  <Calendar className="h-4 w-4" />*/}
            {/*  Schedule*/}
            {/*</TabsTrigger>*/}
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("navigation.clients")}
            </TabsTrigger>
            <TabsTrigger
              value="monitoring-schedule"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {t("navigation.monitoring")}
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("navigation.contracts")}
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("navigation.staff")}
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              {t("navigation.devices")}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t("navigation.allTasks")}
            </TabsTrigger>
            {currentManager?.isSenior && (
              <TabsTrigger
                value="staff-relationships"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {t("navigation.staffRelations")}
              </TabsTrigger>
            )}
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.myWorkSchedule")}</CardTitle>
                <CardDescription>
                  {t("dashboard.weeklySchedule")}
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
                                  Рабочий день
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {daySchedule.startTime} -{" "}
                                  {daySchedule.endTime}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Выходной
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
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.clientManagement")}</CardTitle>
                <CardDescription>
                  {t("dashboard.viewAndManage")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length == 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Вам не назначено ни одного клиента
                  </div>
                ) : (
                  <div>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ФИО</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Статус договора</TableHead>
                            <TableHead>Нарушения</TableHead>
                            <TableHead>Порог</TableHead>
                            <TableHead>Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clients.map((client, index) => (
                            <TableRow key={`client-${client.id}-${index}`}>
                              <TableCell className="font-medium">
                                {client.name} {client.surname} {client.lastname}
                              </TableCell>
                              <TableCell>{client.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={getContractStatusBadgeVariant(
                                    client.latestContract.status,
                                  )}
                                >
                                  {contractStatusToRu(
                                    client.latestContract.status,
                                  )}
                                </Badge>
                              </TableCell>
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
                                  {client.metricThreshold}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      openClientDetailsModal(client)
                                    }
                                    title="Показать детали"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openClientModal(client)}
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Schedule Tab */}
          <TabsContent value="monitoring-schedule">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.clientMonitoringSchedule")}</CardTitle>
                <CardDescription>
                  {t("dashboard.weeklyMonitoringSchedule")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clients.length == 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Вам не назначено ни одного клиента
                  </div>
                ) : (
                  <div>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <ClientMonitoringGanttByWorker
                        clients={clients}
                        onEditSchedule={(client) => {
                          setSelectedClientForMonitoring(client);
                          setIsMonitoringScheduleModalOpen(true);
                        }}
                        isLoading={isLoading}
                        scheduleRefreshTrigger={scheduleRefreshTrigger}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.pendingContracts")}</CardTitle>
                <CardDescription>
                  {t("dashboard.contractsWaitingApproval")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contracts.length == 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Вам не назначено ни одного договора
                  </div>
                ) : (
                  <div>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Договор</TableHead>
                            <TableHead>Дата создания</TableHead>
                            <TableHead>Дата начала</TableHead>
                            <TableHead>Дата окончания</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Клиент</TableHead>
                            <TableHead>Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contracts.map((contract, index) => (
                            <TableRow key={`contract-${contract.id}-${index}`}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-medium">
                                    <Badge
                                      variant="outline"
                                      className={"flex: inner-display gap-2"}
                                    >
                                      <FileText className={"w-4 h-4"} />
                                      Договор #{contract.id}
                                    </Badge>
                                  </div>
                                  {/*{contract.clientDetails && (*/}
                                  {/*  <div className="text-sm text-muted-foreground">*/}
                                  {/*    {contract.clientDetails}*/}
                                  {/*  </div>*/}
                                  {/*)}*/}
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDate(contract.createdAt)}
                              </TableCell>
                              <TableCell>
                                {contract.startDate
                                  ? formatDate(contract.startDate)
                                  : "Не указано"}
                              </TableCell>
                              <TableCell>
                                {contract.endDate ? (
                                  formatDate(contract.endDate)
                                ) : (
                                  <span className="text-muted-foreground">
                                    Бессрочный
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getContractStatusBadgeVariant(
                                    contract.status,
                                  )}
                                >
                                  {contractStatusToRu(contract.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {contract.client
                                  ? `${contract.client.name} ${contract.client.surname} ${contract.client.lastname}`
                                  : `Клиент #${contract.clientId}`}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openContractModal(contract)}
                                    title="Показать детали"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {contract.status ===
                                    ContractStatus.CREATED && (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        sendContractToClient(
                                          contract.id.toString(),
                                        )
                                      }
                                    >
                                      Отправить на подпись клиенту
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{t("dashboard.staffManagement")}</CardTitle>
                    {/*<CardDescription>*/}
                    {/*  {t("dashboard.manageSchedules")}*/}
                    {/*</CardDescription>*/}
                  </div>
                  <Button onClick={() => setIsCreateAccountModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("button.createAccount")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {employees.length == 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    У вас нет назначенных сотрудников
                  </div>
                ) : (
                  <div>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ФИО</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Роль</TableHead>
                            {/*<TableHead>Actions</TableHead>*/}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.map((employee, index) => (
                            <TableRow key={`employee-${employee.id}-${index}`}>
                              <TableCell className="font-medium">
                                {employee.surname} {employee.firstName}{" "}
                                {employee.lastName}
                              </TableCell>
                              <TableCell>{employee.email}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {/*{employee.role*/}
                                  {/*  .replace("_", " ")*/}
                                  {/*  .toUpperCase()}*/}
                                  {emplyeeRoleToRu(employee.role)}
                                </Badge>
                              </TableCell>
                              {/*<TableCell>*/}
                              {/*  <Button*/}
                              {/*    variant="ghost"*/}
                              {/*    size="sm"*/}
                              {/*    onClick={() => openScheduleModal(employee)}*/}
                              {/*  >*/}
                              {/*    <Edit className="h-4 w-4 mr-2" />*/}
                              {/*    Редактировать*/}
                              {/*  </Button>*/}
                              {/*</TableCell>*/}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{t("dashboard.deviceManagement")}</CardTitle>
                    <CardDescription>
                      {t("dashboard.monitorAndManage")}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsRegisterDeviceModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать устройство
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {devices.length == 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Нет доступных или привязанных устройств
                  </div>
                ) : (
                  <div>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Устройство</TableHead>
                            <TableHead>Привязанный клиент</TableHead>
                            <TableHead>Статус привязки</TableHead>
                            <TableHead>Уровень заряда</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {devices.map((device, index) => (
                            <TableRow key={`device-${device.id}-${index}`}>
                              <TableCell className="font-medium">
                                <Badge
                                  variant="outline"
                                  className="flex: inner-display gap-2"
                                >
                                  <Monitor className="h-4 w-4" />
                                  Устройство #{device.deviceId}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {device.assignedClientId ? (
                                  <>
                                    {device.assignedClient.surname}{" "}
                                    {device.assignedClient.name[0]}.{" "}
                                    {device.assignedClient.lastname[0]}.
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">
                                    Не привязано
                                  </span>
                                )}
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
                                  {/*{device.assignmentStatus*/}
                                  {/*  ? device.assignmentStatus.replace(/_/g, " ")*/}
                                  {/*  : "Неизвестно"}*/}
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
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {deviceStatusToRu(device.status)}
                                  {/*{device.status === "ACTIVE"*/}
                                  {/*  ? "Active"*/}
                                  {/*  : device.status === "INACTIVE"*/}
                                  {/*    ? "Inactive"*/}
                                  {/*    : "Off"}*/}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeviceDetailsModal(device)}
                                  title="Показать детали"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.allOfficerTasks")}</CardTitle>
                <CardDescription>
                  {t("dashboard.allPunishmentTasks")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allCombinedTasks.length == 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    У ваших сотрудников нет задач
                  </div>
                ) : (
                  <div>
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <AllTasksTable
                        tasks={allCombinedTasks.filter(
                          (task, index, self) =>
                            self.findIndex(
                              (t) =>
                                t.taskType === task.taskType &&
                                t.id === task.id,
                            ) === index,
                        )}
                        onViewTask={openTaskDetailsModal}
                        workers={workers}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Relationships Tab */}
          {currentManager?.isSenior && (
            <TabsContent value="staff-relationships">
              <Card>
                <CardHeader>
                  <CardTitle>Связи сотруднков</CardTitle>
                  <CardDescription>
                    Управление отношениями между сотрудниками и менеджерами
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reassignmentError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertDescription className="flex items-center justify-between">
                        <span>{reassignmentError}</span>
                        <button
                          onClick={() => setReassignmentError(null)}
                          className="ml-4 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-transparent text-foreground/50 opacity-50 transition-opacity hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Managers and their assigned workers */}
                      <div className="space-y-4">
                        <div>
                          <div className="grid gap-6">
                            {allManagers.map((manager) => {
                              const managerWorkers = allWorkers.filter(
                                (w) => w.manager && w.manager.id === manager.id,
                              );
                              return (
                                <Card key={manager.id} className="border">
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <CardTitle className="text-base">
                                          {manager.surname} {manager.name}{" "}
                                          {manager.lastname}
                                        </CardTitle>
                                        <div className="flex items-center gap-2 mt-1">
                                          <CardDescription className="text-sm">
                                            {manager.email}
                                          </CardDescription>
                                          {manager.isSenior && (
                                            <Badge variant="default">
                                              Старший
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Badge variant="outline">
                                        {managerWorkers.length}{" "}
                                        {morph(managerWorkers.length, [
                                          "сотрудник",
                                          "сотрудника",
                                          "сотрудников",
                                        ])}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    {managerWorkers.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        Нет назначенных сотрудников
                                      </p>
                                    ) : (
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>ФИО</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Роль</TableHead>
                                            {/*<TableHead className="text-right">*/}
                                            {/*  Действия*/}
                                            {/*</TableHead>*/}
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {managerWorkers.map((worker) => (
                                            <TableRow key={worker.id}>
                                              <TableCell className="font-medium">
                                                {worker.surname} {worker.name}{" "}
                                                {worker.lastname}
                                              </TableCell>
                                              <TableCell>
                                                {worker.email}
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant="outline">
                                                  {/*{worker.role.replace(*/}
                                                  {/*  /_/g,*/}
                                                  {/*  " ",*/}
                                                  {/*)}*/}
                                                  {emplyeeRoleToRu(worker.role)}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Select
                                                  onValueChange={(
                                                    newManagerId,
                                                  ) =>
                                                    handleReassignWorker(
                                                      worker.id,
                                                      parseInt(newManagerId),
                                                    )
                                                  }
                                                  disabled={
                                                    assigningWorkerId ===
                                                    worker.id
                                                  }
                                                >
                                                  <SelectTrigger className="w-[180px]">
                                                    {assigningWorkerId ===
                                                    worker.id ? (
                                                      <>
                                                        <X className="h-4 w-4 animate-spin mr-2" />
                                                        Переназначение...
                                                      </>
                                                    ) : (
                                                      <SelectValue placeholder="Сменить менеджера" />
                                                    )}
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {allManagers
                                                      .filter(
                                                        (m) =>
                                                          m.id !== manager.id,
                                                      )
                                                      .map((m) => (
                                                        <SelectItem
                                                          key={m.id}
                                                          value={m.id.toString()}
                                                        >
                                                          {m.surname}{" "}
                                                          {m.name[0]}.{" "}
                                                          {m.lastname[0]}.
                                                        </SelectItem>
                                                      ))}
                                                  </SelectContent>
                                                </Select>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/*/!* Unassigned workers *!/*/}
                      {/*<div className="border-t pt-6">*/}
                      {/*  <h3 className="text-lg font-semibold mb-4">*/}
                      {/*    Unassigned Staff*/}
                      {/*  </h3>*/}
                      {/*  {unassignedWorkers.length === 0 ? (*/}
                      {/*    <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">*/}
                      {/*      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />*/}
                      {/*      <p className="text-muted-foreground">*/}
                      {/*        No unassigned staff*/}
                      {/*      </p>*/}
                      {/*    </div>*/}
                      {/*  ) : (*/}
                      {/*    <Table>*/}
                      {/*      <TableHeader>*/}
                      {/*        <TableRow>*/}
                      {/*          <TableHead>Name</TableHead>*/}
                      {/*          <TableHead>Email</TableHead>*/}
                      {/*          <TableHead>Role</TableHead>*/}
                      {/*          <TableHead className="text-right">*/}
                      {/*            Actions*/}
                      {/*          </TableHead>*/}
                      {/*        </TableRow>*/}
                      {/*      </TableHeader>*/}
                      {/*      <TableBody>*/}
                      {/*        {unassignedWorkers.map((worker) => (*/}
                      {/*          <TableRow key={worker.id}>*/}
                      {/*            <TableCell className="font-medium">*/}
                      {/*              {worker.name} {worker.surname}{" "}*/}
                      {/*              {worker.lastname}*/}
                      {/*            </TableCell>*/}
                      {/*            <TableCell>{worker.email}</TableCell>*/}
                      {/*            <TableCell>*/}
                      {/*              <Badge variant="secondary">*/}
                      {/*                {worker.role.replace(/_/g, " ")}*/}
                      {/*              </Badge>*/}
                      {/*            </TableCell>*/}
                      {/*            <TableCell className="text-right">*/}
                      {/*              <Select*/}
                      {/*                onValueChange={(managerId) =>*/}
                      {/*                  handleAssignWorker(*/}
                      {/*                    worker.id,*/}
                      {/*                    parseInt(managerId),*/}
                      {/*                  )*/}
                      {/*                }*/}
                      {/*                disabled={assigningWorkerId === worker.id}*/}
                      {/*              >*/}
                      {/*                <SelectTrigger className="w-[180px]">*/}
                      {/*                  {assigningWorkerId === worker.id ? (*/}
                      {/*                    <>*/}
                      {/*                      <X className="h-4 w-4 animate-spin mr-2" />*/}
                      {/*                      Assigning...*/}
                      {/*                    </>*/}
                      {/*                  ) : (*/}
                      {/*                    <SelectValue placeholder="Select a manager" />*/}
                      {/*                  )}*/}
                      {/*                </SelectTrigger>*/}
                      {/*                <SelectContent>*/}
                      {/*                  {allManagers.map((m) => (*/}
                      {/*                    <SelectItem*/}
                      {/*                      key={m.id}*/}
                      {/*                      value={m.id.toString()}*/}
                      {/*                    >*/}
                      {/*                      {m.name} {m.surname}*/}
                      {/*                    </SelectItem>*/}
                      {/*                  ))}*/}
                      {/*                </SelectContent>*/}
                      {/*              </Select>*/}
                      {/*            </TableCell>*/}
                      {/*          </TableRow>*/}
                      {/*        ))}*/}
                      {/*      </TableBody>*/}
                      {/*    </Table>*/}
                      {/*  )}*/}
                      {/*</div>*/}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Schedule Editing Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              {selectedEmployee &&
                `Управление расписанием ${selectedEmployee.firstName} ${selectedEmployee.surname} ${selectedEmployee.lastName}`}
            </DialogDescription>
          </DialogHeader>

          {scheduleError && (
            <Alert variant="destructive">
              <AlertDescription>{scheduleError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {getWeekdays().map((day) => {
              const schedule = getScheduleForDay(day.key);
              const isWorkDay = !!schedule;
              // Parse HH:MM:SS format to HH:MM for input fields
              const startTime = schedule
                ? schedule.begin.substring(0, 5)
                : "09:00";
              const endTime = schedule
                ? schedule.ending.substring(0, 5)
                : "17:00";

              return (
                <div
                  key={day.key}
                  className={`border rounded-lg p-4 transition-colors ${
                    isWorkDay
                      ? "border-primary/20 bg-primary/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {day.label}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`work-${day.key}`}
                        checked={isWorkDay}
                        onCheckedChange={(checked) =>
                          updateDaySchedule(
                            day.key,
                            checked as boolean,
                            startTime,
                            endTime,
                          )
                        }
                      />
                      <Label
                        htmlFor={`work-${day.key}`}
                        className="font-medium"
                      >
                        Work Day
                      </Label>
                    </div>
                  </div>

                  {isWorkDay && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor={`start-${day.key}`}
                          className="text-sm font-medium"
                        >
                          Start Time
                        </Label>
                        <Input
                          id={`start-${day.key}`}
                          type="time"
                          value={startTime}
                          onChange={(e) =>
                            updateDaySchedule(
                              day.key,
                              true,
                              e.target.value,
                              endTime,
                            )
                          }
                          className="w-full font-mono"
                          min="00:00"
                          max="23:59"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor={`end-${day.key}`}
                          className="text-sm font-medium"
                        >
                          End Time
                        </Label>
                        <Input
                          id={`end-${day.key}`}
                          type="time"
                          value={endTime}
                          onChange={(e) =>
                            updateDaySchedule(
                              day.key,
                              true,
                              startTime,
                              e.target.value,
                            )
                          }
                          className="w-full font-mono"
                          min="00:00"
                          max="23:59"
                        />
                      </div>
                    </div>
                  )}

                  {!isWorkDay && (
                    <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-md">
                      <Calendar className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">Day Off</p>
                      <p className="text-xs">No work scheduled</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={closeScheduleModal}
              disabled={isUpdatingSchedule}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {employeeSchedule.length} work day(s) scheduled
              </span>
              <Button
                onClick={saveSchedule}
                disabled={isUpdatingSchedule}
                className="min-w-[120px]"
              >
                {isUpdatingSchedule ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Schedule"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Client Threshold Management Modal */}
      <ClientThresholdModal
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
        currentManager={currentManager}
      />

      {/* Client Details Modal */}
      <Dialog
        open={isClientDetailsModalOpen}
        onOpenChange={closeClientDetailsModal}
      >
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto ">
          <DialogHeader>
            <DialogTitle>Детали клиента</DialogTitle>
            <DialogDescription>
              Подробная информация о выбранном клиенте
            </DialogDescription>
          </DialogHeader>

          {selectedClientForDetails && (
            <div className="space-y-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Информация о клиенте
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        ID клиента
                      </Label>
                      <p className="text-lg font-semibold">
                        #{selectedClientForDetails.id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Полное имя
                      </Label>
                      <p>
                        {selectedClientForDetails.name}{" "}
                        {selectedClientForDetails.surname}{" "}
                        {selectedClientForDetails.lastname}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Email
                      </Label>
                      <p>{selectedClientForDetails.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Количество нарушений
                      </Label>
                      <p className="text-lg font-semibold text-red-600">
                        {selectedClientForDetails.violationsCount}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Порог метрики
                      </Label>
                      <p>{selectedClientForDetails.metricThreshold}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Дата создания
                      </Label>
                      <p>{formatDate(selectedClientForDetails.createdAt)}</p>
                    </div>
                    {/*<div>*/}
                    {/*  <Label className="text-sm font-medium text-muted-foreground">*/}
                    {/*    П*/}
                    {/*  </Label>*/}
                    {/*  <p>{formatDate(selectedClientForDetails.updatedAt)}</p>*/}
                    {/*</div>*/}
                    {selectedClientForDetails.deletedAt && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Дата удалния
                        </Label>
                        <p className="text-red-600">
                          {formatDate(selectedClientForDetails.deletedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Client Metrics Visualization */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Метрики клиента
                      {clientMetrics.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {clientMetrics.length}{" "}
                          {morph(clientMetrics.length, ["метрика", "метрики", "метрик"])}
                        </Badge>
                      )}
                    </CardTitle>
                    <Select
                      value={clientMetricsTimeInterval}
                      onValueChange={(value) =>
                        setClientMetricsTimeInterval(
                          value as "5m" | "30m" | "1h" | "1d",
                        )
                      }
                    >
                      <SelectTrigger className="w-25">
                        <SelectValue
                          placeholder={t("device.selectTimeRange")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5m">Последние 5 минут</SelectItem>
                        <SelectItem value="30m">Последние 30 минут</SelectItem>
                        <SelectItem value="1h">Последний час</SelectItem>
                        <SelectItem value="1d">Последний день</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingClientDetails ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : clientMetrics.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Для этого клиента нет метрик
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
                          option={(() => {
                            const colorPalette = [
                              "#3b82f6",
                              "#ef4444",
                              "#10b981",
                              "#f59e0b",
                              "#8b5cf6",
                              "#ec4899",
                              "#14b8a6",
                              "#f97316",
                            ];

                            const getColorForDevice = (
                              deviceId: number,
                            ): string => {
                              return colorPalette[
                                deviceId % colorPalette.length
                              ];
                            };

                            const groupMetricsByDevice = (
                              metricsData: Metric[],
                            ) => {
                              const grouped: { [deviceId: number]: Metric[] } =
                                {};
                              metricsData.forEach((metric) => {
                                if (!grouped[metric.deviceId]) {
                                  grouped[metric.deviceId] = [];
                                }
                                grouped[metric.deviceId].push(metric);
                              });
                              return grouped;
                            };

                            const calculateDataZoomRange = (
                              interval: "5m" | "30m" | "1h" | "1d",
                            ) => {
                              if (clientMetrics.length === 0) {
                                return { start: 0, end: 100 };
                              }

                              const metricTimestamps = clientMetrics.map((m) =>
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

                              const scalePercentage = Math.min(
                                (intervalMs / totalSpan) * 100,
                                100,
                              );
                              const start = Math.max(0, 100 - scalePercentage);

                              return { start, end: 100 };
                            };

                            const zoomRange = calculateDataZoomRange(
                              clientMetricsTimeInterval,
                            );
                            const groupedByDevice =
                              groupMetricsByDevice(clientMetrics);

                            return {
                              tooltip: {
                                trigger: "axis",
                                backgroundColor: "#fff",
                                borderColor: "#ccc",
                                textStyle: {
                                  color: "#000",
                                },
                                formatter: (params: any) => {
                                  if (
                                    Array.isArray(params) &&
                                    params.length > 0
                                  ) {
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
                                  color: "#111",
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
                                name: "Metric Value",
                                min: 0,
                                max: 100,
                              },
                              series: Object.entries(groupedByDevice).map(
                                ([deviceId, deviceMetrics]) => {
                                  const color = getColorForDevice(
                                    Number(deviceId),
                                  );
                                  return {
                                    name: `Устройство #${deviceId}`,
                                    type: "line",
                                    showSymbol: false,
                                    data: deviceMetrics.map((m) => [
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
                                    markLine: {
                                      symbol: ["none", "none"],
                                      data: [
                                        {
                                          name: `Порог (${selectedClientForDetails?.metricThreshold || 0})`,
                                          yAxis:
                                            selectedClientForDetails?.metricThreshold ||
                                            0,
                                          lineStyle: {
                                            color: "#ef4444",
                                            type: "dashed",
                                            width: 2,
                                          },
                                          label: {
                                            normal: {
                                              show: false,
                                            },
                                          },
                                          // label: {
                                          //   position: "right",
                                          //   formatter: `Threshold: ${selectedClientForDetails?.metricThreshold || 0}`,
                                          //   fontSize: 12,
                                          //   color: "#ef4444",
                                          // },
                                        },
                                      ],
                                    },
                                  };
                                },
                              ),
                              grid: {
                                left: "5%",
                                right: "5%",
                                top: "60px",
                                bottom: "50px",
                                containLabel: true,
                              },
                              dataZoom: [
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
                              ],
                            };
                          })()}
                          style={{ width: "100%", height: "300px" }}
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
                    <MapIcon className="h-4 w-4" />
                    {t("modal.clientGeolocation")}
                  </CardTitle>
                  {latestClientMetric ? (
                    <CardDescription>
                      Last known location:{" "}
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
                    popupText={
                      "" +
                      selectedClientForDetails.surname +
                      " " +
                      selectedClientForDetails.name[0] +
                      ". " +
                      selectedClientForDetails.lastname[0] +
                      "."
                    }
                    formatDateTime={formatDateTime}
                  />
                </CardContent>
              </Card>

              {/*/!* Punishment Tasks *!/*/}
              {/*<Card>*/}
              {/*  <CardHeader>*/}
              {/*    <CardTitle className="text-lg">Punishment Tasks</CardTitle>*/}
              {/*    <CardDescription>*/}
              {/*      All punishment tasks assigned to this client*/}
              {/*    </CardDescription>*/}
              {/*  </CardHeader>*/}
              {/*  <CardContent>*/}
              {/*    {isLoadingClientDetails ? (*/}
              {/*      <div className="flex justify-center py-8">*/}
              {/*        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>*/}
              {/*      </div>*/}
              {/*    ) : clientTasks.length === 0 ? (*/}
              {/*      <div className="text-center py-8 text-muted-foreground">*/}
              {/*        No punishment tasks found for this client.*/}
              {/*      </div>*/}
              {/*    ) : (*/}
              {/*      <Table>*/}
              {/*        <TableHeader>*/}
              {/*          <TableRow>*/}
              {/*            <TableHead>Task ID</TableHead>*/}
              {/*            /!*<TableHead>Status</TableHead>*!/*/}
              {/*            <TableHead>Type</TableHead>*/}
              {/*            <TableHead>Executor ID</TableHead>*/}
              {/*            <TableHead>Creator ID</TableHead>*/}
              {/*            <TableHead>Created Date</TableHead>*/}
              {/*            <TableHead>Completed Date</TableHead>*/}
              {/*          </TableRow>*/}
              {/*        </TableHeader>*/}
              {/*        <TableBody>*/}
              {/*          {clientTasks.map((task, index) => (*/}
              {/*            <TableRow key={`client-task-${task.id}-${index}`}>*/}
              {/*              <TableCell>#{task.id}</TableCell>*/}
              {/*              <TableCell>*/}
              {/*                <Badge*/}
              {/*                  variant={*/}
              {/*                    task.status === TaskStatus.DONE*/}
              {/*                      ? "default"*/}
              {/*                      : task.status === TaskStatus.IN_PROGRESS*/}
              {/*                        ? "secondary"*/}
              {/*                        : task.status === TaskStatus.CANCELLED*/}
              {/*                          ? "destructive"*/}
              {/*                          : "outline"*/}
              {/*                  }*/}
              {/*                >*/}
              {/*                  {task.status.replace("_", " ")}*/}
              {/*                </Badge>*/}
              {/*              </TableCell>*/}
              {/*              <TableCell>Assigned by {task.assignedBy}</TableCell>*/}
              {/*              <TableCell>{formatDate(task.dueDate)}</TableCell>*/}
              {/*              <TableCell>{formatDate(task.createdAt)}</TableCell>*/}
              {/*              <TableCell>*/}
              {/*                {task.completedAt ? (*/}
              {/*                  formatDate(task.completedAt)*/}
              {/*                ) : (*/}
              {/*                  <span className="text-muted-foreground">*/}
              {/*                    Not completed*/}
              {/*                  </span>*/}
              {/*                )}*/}
              {/*              </TableCell>*/}
              {/*            </TableRow>*/}
              {/*          ))}*/}
              {/*        </TableBody>*/}
              {/*      </Table>*/}
              {/*    )}*/}
              {/*  </CardContent>*/}
              {/*</Card>*/}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeClientDetailsModal}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Details Modal */}
      <Dialog open={isContractModalOpen} onOpenChange={setIsContractModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали договора</DialogTitle>
            <DialogDescription>
              Просмотр и управление информацией о договорах
            </DialogDescription>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-6">
              {/* Contract Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Идентификатор договора
                  </Label>
                  <p className="text-lg font-semibold">
                    #{selectedContract.id}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Статус
                  </Label>
                  <div className="mt-1">
                    <Badge
                      variant={getContractStatusBadgeVariant(
                        selectedContract.status,
                      )}
                    >
                      {contractStatusToRu(selectedContract.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Дата создания
                  </Label>
                  <p>{formatDate(selectedContract.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Дата подписания
                  </Label>
                  <p>
                    {selectedContract.signedAt
                      ? formatDate(selectedContract.signedAt)
                      : "Не подписан"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Дата начала
                  </Label>
                  <p>
                    {selectedContract.startDate
                      ? formatDate(selectedContract.startDate)
                      : "Не указана"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Дата окончания
                  </Label>
                  <p>
                    {selectedContract.endDate
                      ? formatDate(selectedContract.endDate)
                      : "Бессрочный"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Клиент
                  </Label>
                  <p>
                    {selectedContract.client
                      ? `${selectedContract.client.surname} ${selectedContract.client.name} ${selectedContract.client.lastname}`
                      : `Клиент #${selectedContract.clientId}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Подписывающий
                  </Label>
                  <p>
                    {selectedContract.signer
                      ? `${selectedContract.signer.surname} ${selectedContract.signer.name} ${selectedContract.signer.lastname}`
                      : `Подписываюший #${selectedContract.signerId}`}
                  </p>
                </div>
              </div>

              {/* File Information */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Файл
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm bg-muted px-2 py-1 rounded">
                    {selectedContract.filename}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadContractFile(selectedContract)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Скачать
                  </Button>
                </div>
              </div>

              {/* Client Details (Editable) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Детали
                  </Label>
                  {!isEditingContract && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingContract(true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Редактировать
                    </Button>
                  )}
                </div>

                {isEditingContract ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContractDetails}
                      onChange={(e) => setEditContractDetails(e.target.value)}
                      placeholder="Введите детали договора..."
                      rows={4}
                      className="w-full overflow-hidden whitespace-normal break-all"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={updateContractDetails}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Сохранить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingContract(false);
                          setEditContractDetails(
                            selectedContract.clientDetails || "",
                          );
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm p-3 bg-muted rounded-md min-h-[80px] overflow-hidden whitespace-normal break-all">
                    {selectedContract.clientDetails ||
                      "Деталей не предоставлено"}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsContractModalOpen(false)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Device Modal */}
      <RegisterDeviceModal
        open={isRegisterDeviceModalOpen}
        onOpenChange={setIsRegisterDeviceModalOpen}
        onDeviceCreated={handleDeviceCreated}
      />

      {/* Create Account Modal */}
      <Dialog
        open={isCreateAccountModalOpen}
        onOpenChange={setIsCreateAccountModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Создать новый аккаунт</DialogTitle>
            <DialogDescription>
              Создайте новую учетную запись для сотрудника или менеджера в
              системе.
            </DialogDescription>
          </DialogHeader>

          {createAccountForm.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>
                {createAccountForm.formState.errors.root.message}
              </AlertDescription>
            </Alert>
          )}

          <Form {...createAccountForm}>
            <form
              onSubmit={createAccountForm.handleSubmit(createAccount)}
              className="space-y-4"
            >
              <FormField
                control={createAccountForm.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип аккаунта</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("misc.accountType")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee-corrections">
                          Сотрудник наказаний
                        </SelectItem>
                        <SelectItem value="employee-surveillance">
                          Сотрудник слежки
                        </SelectItem>
                        {currentManager?.isSenior && (
                          <SelectItem value="manager">Менеджер</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {!currentManager?.isSenior &&
                      createAccountForm.watch("accountType") === "manager" && (
                        <FormMessage className="text-destructive">
                          {t("misc.onlySeniorCanCreateManager")}
                        </FormMessage>
                      )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createAccountForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("misc.enterEmailAddress")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createAccountForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("misc.enterFirstNamePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createAccountForm.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("misc.enterLastNamePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={createAccountForm.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Отчество</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("misc.enterMiddleNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {createAccountForm.watch("accountType") === "manager" && (
                <FormField
                  control={createAccountForm.control}
                  name="isSenior"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Старший менеджер</FormLabel>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateAccountModalOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isCreatingAccount}>
                  {isCreatingAccount
                    ? t("misc.creatingAccount")
                    : t("button.createAccount")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Task Details Modal */}
      <TaskDetailsModal
        isOpen={isTaskDetailsModalOpen}
        onClose={() => setIsTaskDetailsModalOpen(false)}
        task={selectedTaskForDetails}
        onCancelTask={handleCancelTask}
        cancellingTaskId={cancellingTaskId}
      />

      {/* Device Details Modal */}
      <DeviceDetailsModal
        isOpen={isDeviceDetailsModalOpen}
        onClose={() => setIsDeviceDetailsModalOpen(false)}
        device={selectedDeviceForDetails}
        onReplaceDevice={openDeviceReplacementModal}
        refreshTrigger={deviceDetailsRefreshTrigger}
      />

      {/* Device Replacement Modal */}
      <DeviceReplacementModal
        isOpen={isDeviceReplacementModalOpen}
        onClose={() => setIsDeviceReplacementModalOpen(false)}
        device={selectedDeviceForReplacement}
        onSuccess={handleReplacementSuccess}
      />

      {/* Client Monitoring Schedule Modal */}
      <ClientMonitoringScheduleModal
        isOpen={isMonitoringScheduleModalOpen}
        client={selectedClientForMonitoring}
        onClose={() => {
          setIsMonitoringScheduleModalOpen(false);
          setSelectedClientForMonitoring(null);
        }}
        onScheduleUpdated={() => {
          setScheduleRefreshTrigger((prev) => prev + 1);
          if (activeTab === "monitoring-schedule") {
            loadClients();
          }
        }}
      />
    </Layout>
  );
}

// All Tasks Table Component for Manager Dashboard
function AllTasksTable({
  tasks,
  onViewTask,
  workers,
}: {
  tasks: CombinedTask[];
  onViewTask: (task: CombinedTask) => void;
  workers: Worker[];
}) {
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

  const getTaskTypeDisplay = (task: CombinedTask) => {
    if (task.taskType === "device-change") {
      return "Замена устройства";
    } else {
      return "Наказание";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getExecutorName = (task: CombinedTask) => {
    if (task.taskType === "punishment") {
      const worker = workers.find((w) => w.id === task.executionerId);
      if (worker) {
        return `${worker.surname} ${worker.name[0]}. ${worker.lastname[0]}.`;
      }
      return `Сотрудник (ID: ${task.executionerId})`;
    } else {
      // DeviceChangeTask has executionerId field
      const worker = workers.find((w) => w.id === task.executionerId);
      if (worker) {
        return `${worker.surname} ${worker.name[0]}. ${worker.lastname[0]}.`;
      }
      return `Сотрудник (ID: ${task.executionerId})`;
    }
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          There are no tasks assigned to your workers.
        </div>
      ) : (
        <>
          {/*/!* Task Statistics *!/*/}
          {/*<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">*/}
          {/*  <Card>*/}
          {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
          {/*      <CardTitle className="text-sm font-medium">*/}
          {/*        Total Tasks*/}
          {/*      </CardTitle>*/}
          {/*      <CheckCircle className="h-4 w-4 text-muted-foreground" />*/}
          {/*    </CardHeader>*/}
          {/*    <CardContent>*/}
          {/*      <div className="text-2xl font-bold">{tasks.length}</div>*/}
          {/*    </CardContent>*/}
          {/*  </Card>*/}
          {/*  <Card>*/}
          {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
          {/*      <CardTitle className="text-sm font-medium">Completed</CardTitle>*/}
          {/*      <CheckCircle className="h-4 w-4 text-green-600" />*/}
          {/*    </CardHeader>*/}
          {/*    <CardContent>*/}
          {/*      <div className="text-2xl font-bold text-green-600">*/}
          {/*        {tasks.filter((t) => t.status === TaskStatus.DONE).length}*/}
          {/*      </div>*/}
          {/*    </CardContent>*/}
          {/*  </Card>*/}
          {/*  <Card>*/}
          {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
          {/*      <CardTitle className="text-sm font-medium">*/}
          {/*        In Progress*/}
          {/*      </CardTitle>*/}
          {/*      <Clock className="h-4 w-4 text-blue-600" />*/}
          {/*    </CardHeader>*/}
          {/*    <CardContent>*/}
          {/*      <div className="text-2xl font-bold text-blue-600">*/}
          {/*        {*/}
          {/*          tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)*/}
          {/*            .length*/}
          {/*        }*/}
          {/*      </div>*/}
          {/*    </CardContent>*/}
          {/*  </Card>*/}
          {/*  <Card>*/}
          {/*    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">*/}
          {/*      <CardTitle className="text-sm font-medium">Pending</CardTitle>*/}
          {/*      <Clock className="h-4 w-4 text-yellow-600" />*/}
          {/*    </CardHeader>*/}
          {/*    <CardContent>*/}
          {/*      <div className="text-2xl font-bold text-yellow-600">*/}
          {/*        {tasks.filter((t) => t.status === TaskStatus.NEW).length}*/}
          {/*      </div>*/}
          {/*    </CardContent>*/}
          {/*  </Card>*/}
          {/*</div>*/}

          {/* Tasks Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Задание</TableHead>
                <TableHead>Клиент</TableHead>
                <TableHead>Детали</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Дата выполнения</TableHead>
                <TableHead>Исполнитель</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task, index) => (
                <TableRow key={`${task.taskType}-${task.id}-${index}`}>
                  {/*<TableCell>*/}
                  {/*  <div>*/}
                  {/*    <div className="font-medium">*/}
                  {/*      {task.taskType === "device-change"*/}
                  {/*        ? `Замена #${task.id}`*/}
                  {/*        : `Наказание #${task.id}`}*/}
                  {/*    </div>*/}
                  {/*    {task.taskType === "punishment" && (*/}
                  {/*      <div className="text-sm text-muted-foreground">*/}
                  {/*        {task.title}*/}
                  {/*      </div>*/}
                  {/*    )}*/}
                  {/*  </div>*/}
                  {/*</TableCell>*/}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={"flex: inner-display gap-2"}
                    >
                      {task.taskType == "punishment" ? (
                        <HandFist className={"w-4 h-4"} />
                      ) : (
                        <Monitor className={"w-4 h-4"} />
                      )}
                      {getTaskTypeDisplay(task)} #{task.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {task.client ? (
                        <div className="font-medium">
                          {task.client.surname} {task.client.name[0]}
                          {". "}
                          {task.client.lastname[0]}
                          {"."}
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

                  <TableCell>{formatDate(task.createdAt)}</TableCell>
                  <TableCell>
                    {task.taskType === "device-change" ? (
                      task.doneAt ? (
                        <div className="text-sm">{formatDate(task.doneAt)}</div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Не завершено
                        </div>
                      )
                    ) : task.completedAt ? (
                      <div className="text-sm text-green-600">
                        {formatDate(task.completedAt)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Не завершено
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{getExecutorName(task)}</div>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  );
}
