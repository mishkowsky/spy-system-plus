/**
 * Shared types between client and server
 */

export enum WorkerRole {
  CORRECTIONS_OFFICER = "CORRECTIONS_OFFICER",
  SURVEILLANCE_OFFICER = "SURVEILLANCE_OFFICER",
}

export interface Worker {
  id: number;
  email: string;
  password?: string;
  name: string;
  surname: string;
  lastname: string;
  role: WorkerRole;
  managerId?: number;
  manager?: Manager;
}

export interface Manager {
  id: number;
  email: string;
  password?: string;
  name: string;
  surname: string;
  lastname: string;
  isSenior: boolean;
}

// Legacy User type for compatibility
export enum UserRole {
  CLIENT = "client",
  MANAGER = "manager",
  SENIOR_MANAGER = "senior_manager",
  SURVEILLANCE_OFFICER = "SURVEILLANCE_OFFICER",
  CORRECTIONS_OFFICER = "CORRECTIONS_OFFICER",
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  // Support both legacy and OpenAPI field names
  firstName?: string;
  lastName?: string;
  name?: string;
  surname?: string;
  lastname?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Client {
  id: number;
  email: string;
  password?: string;
  name: string;
  surname: string;
  lastname: string;
  violationsCount: number;
  metricThreshold: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  canCreateNewContract: boolean;
  latestContract?: Contract
}

export enum ContractStatus {
  CREATED = "CREATED",
  SEND_TO_CLIENT = "SEND_TO_CLIENT",
  SIGNED = "SIGNED",
  ACTIVE = "ACTIVE",
  OUTDATED = "OUTDATED"
}

export interface Contract {
  id: number;
  status: ContractStatus;
  filepath: string;
  filename: string;
  clientId: number;
  signerId: number;
  createdAt: string;
  signedAt?: string;
  clientDetails?: string;
  startDate?: string;
  endDate?: string;
  // Optional signer details for populated responses
  signer?: Pick<Manager, "name" | "surname" | "lastname">;
  // Optional client details for populated responses
  client?: Pick<Client, "name" | "surname" | "lastname">;
}

// Device Status enum
export enum DeviceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OFF = "OFF",
}

export enum DeviceAssignmentStatus {
  ASSIGNED = "ASSIGNED",
  UNASSIGNED = "UNASSIGNED",
  ASSIGNMENT_PENDING = "ASSIGNMENT_PENDING",
  UNASSIGNMENT_PENDING = "UNASSIGNMENT_PENDING",
}

// Device types from OpenAPI
export interface Device {
  id: number;
  deviceId: number;
  batteryLevel: number; // Battery level percentage (0-100)
  status: DeviceStatus;
  lastActiveTime: string; // datetime
  assignedClientId: number | null;
  assignedClient: Client | null;
  assignmentStatus: DeviceAssignmentStatus;
  createdAt: string; // datetime
  updatedAt: string; // datetime
}

// Schedule types from OpenAPI
export enum Weekday {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export interface TimeInterval {
  id: number;
  workerId: number;
  managerId: number;
  begin: string; // datetime
  ending: string; // datetime
  weekday: Weekday;
}

export interface MonitoringTimeInterval {
  id: number;
  worker: Worker;
  client: Client;
  begin: string; // HH:MM:SS format
  ending: string; // HH:MM:SS format
  weekday: Weekday;
}

export interface MonitoringTimeIntervalDTO {
  workerId?: number;
  clientId: number;
  begin: string; // HH:MM:SS format
  ending: string; // HH:MM:SS format
  weekday: Weekday;
}

// Additional OpenAPI types
export interface Metric {
  id: number;
  deviceId: number;
  clientId: number;
  value: number;
  timestamp: string;
  latitude: number;
  longitude: number;
}

export interface File {
  path: string;
  name: string;
  uploaderId: number;
}

// Legacy types for compatibility
export interface WorkSchedule {
  id: string;
  employeeId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isWorkDay: boolean;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  surname: string
  email: string;
  role: UserRole;
  managerId?: string;
  schedule: WorkSchedule[];
}

// Violation types
export enum PunishmentType {
  PHYSICAL = "PHYSICAL",
  ELECTRICAL = "ELECTRICAL",
}

// Punishment task types from OpenAPI
export enum TaskStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
}

export interface PunishmentTask {
  id: number;
  title: string;
  description: string;
  type: PunishmentType;
  status: TaskStatus;
  clientId: number;
  assignedBy: number;
  dueDate: string; // datetime
  createdAt: string; // datetime
  updatedAt: string; // datetime
  completedAt?: string; // datetime
  // Optional client details for populated responses
  client?: Pick<Client, "name" | "surname" | "lastname" | "id" | "email">;
}

// DeviceChangeTaskType enum removed - not present in OpenAPI specification

export interface DeviceChangeTask {
  id: number;
  status: TaskStatus;
  clientId: number;
  oldDeviceId: number;
  newDeviceId: number;
  executionerId: number;
  creatorId: number;
  createdAt: string; // datetime
  doneAt?: string; // datetime
  // Optional populated references
  client?: Pick<Client, "name" | "surname" | "lastname" | "id" | "email">;
  oldDevice?: Pick<Device, "deviceId" | "batteryLevel" | "status">;
  newDevice?: Pick<Device, "deviceId" | "batteryLevel" | "status">;
}

// Notification types from OpenAPI
export enum NotificationType {
  CONTRACT_CREATION = "CONTRACT_CREATION",
  CONTRACT_STATUS_UPDATE = "CONTRACT_STATUS_UPDATE",
  PUNISHMENT_TASK_CREATION = "PUNISHMENT_TASK_CREATION",
  DEVICE_CHANGE_TASK_CREATION = "DEVICE_CHANGE_TASK_CREATION",
  TASK_CANCELLED = "TASK_CANCELLED",
  NEW_CLIENT_ASSIGNED = "NEW_CLIENT_ASSIGNED",
  DEVICE_OFF = "DEVICE_OFF",
  DEVICE_INACTIVE = "DEVICE_INACTIVE",
  DEVICE_LOW_BATTERY = "DEVICE_LOW_BATTERY",
  CONTRACT_OUTDATED = "CONTRACT_OUTDATED",
}

export enum NotificationStatus {
  READ = "read",
  UNREAD = "UNREAD",
}

export interface Notification {
  id: number;
  text: string;
  type: NotificationType;
  relatedEntityId: number;
  status: NotificationStatus;
  clientId?: number;
  workerId?: number;
  managerId?: number;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Request types
export interface CreateContractRequest {
  clientId: string;
  clientDetails: string;
  filepath: string;
  startDate: string; // Date without time (YYYY-MM-DD format)
  endDate?: string; // Optional - Date without time (YYYY-MM-DD format), can be empty for open-ended contracts
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  completedAt?: string;
}

export interface UpdateContractStatusRequest {
  status: ContractStatus;
}
