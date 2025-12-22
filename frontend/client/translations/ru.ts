// Russian translations for the application

import {
  ContractStatus,
  DeviceAssignmentStatus,
  DeviceStatus,
  NotificationStatus,
  NotificationType,
  PunishmentType,
  TaskStatus,
  TimeInterval,
  UserRole,
  Weekday,
  WorkerRole,
} from "@/types.ts";

export const contractStatusToClientRu = (s: ContractStatus): string => {
  const ru = {
    [ContractStatus.CREATED]: "Новый",
    [ContractStatus.ACTIVE]: "Активен",
    [ContractStatus.SIGNED]: "Активен",
    [ContractStatus.OUTDATED]: "Просрочен",
    [ContractStatus.SEND_TO_CLIENT]: "Ожидает подписания",
  };
  return ru[s];
};

export const contractStatusToRu = (s: ContractStatus): string => {
  const ru = {
    [ContractStatus.CREATED]: "Новый",
    [ContractStatus.ACTIVE]: "Активен",
    [ContractStatus.SIGNED]: "Подписан",
    [ContractStatus.OUTDATED]: "Просрочен",
    [ContractStatus.SEND_TO_CLIENT]: "Отправлен клиенту",
  };
  return ru[s];
};

export const punishmentTypeToRu = (s: PunishmentType): string => {
  const ru = {
    [PunishmentType.ELECTRICAL]: "Электрическое",
    [PunishmentType.PHYSICAL]: "Физическое",
  };
  return ru[s];
};

export const taskStatusToRu = (s: TaskStatus): string => {
  const ru = {
    [TaskStatus.NEW]: "Новое",
    [TaskStatus.DONE]: "Выполнено",
    [TaskStatus.CANCELLED]: "Отменено",
    [TaskStatus.IN_PROGRESS]: "В работе",
  };
  return ru[s];
};

export const deviceStatusToRu = (s: DeviceStatus): string => {
  const ru = {
    [DeviceStatus.OFF]: "Выключено",
    [DeviceStatus.ACTIVE]: "Актвино",
    [DeviceStatus.INACTIVE]: "Не активно",
  };
  return ru[s];
};

export const deviceAssignmentStatusToRu = (
  s: DeviceAssignmentStatus,
): string => {
  const ru = {
    [DeviceAssignmentStatus.UNASSIGNED]: "Не привязано",
    [DeviceAssignmentStatus.ASSIGNED]: "Привязано",
    [DeviceAssignmentStatus.ASSIGNMENT_PENDING]: "Ожидание привязки",
    [DeviceAssignmentStatus.UNASSIGNMENT_PENDING]: "Ожидание отвязки",
  };
  return ru[s];
};

export const notificationStatusToRu = (s: NotificationStatus): string => {
  const ru = {
    [NotificationStatus.READ]: "Прочитано",
    [NotificationStatus.UNREAD]: "Не прочитано",
  };
  return ru[s];
};

export const notificationTypeToRu = (s: NotificationType): string => {
  const ru = {
    [NotificationType.CONTRACT_CREATION]: "Договор создан",
    [NotificationType.CONTRACT_STATUS_UPDATE]: "Обновлен статус договора",
    [NotificationType.PUNISHMENT_TASK_CREATION]: "Создано задание наказания",
    [NotificationType.DEVICE_CHANGE_TASK_CREATION]:
      "Создано задание замены устройства",
    [NotificationType.TASK_CANCELLED]: "Задание отменено",
    [NotificationType.NEW_CLIENT_ASSIGNED]: "Новый клиент",
    [NotificationType.DEVICE_OFF]: "Устройство выключено",
    [NotificationType.DEVICE_INACTIVE]: "Устройство неактивно",
    [NotificationType.DEVICE_LOW_BATTERY]: "Устройство разряжено",
    [NotificationType.CONTRACT_OUTDATED]: "Договор завершен",
  };
  return ru[s];
};

export const emplyeeRoleToRu = (s: WorkerRole | UserRole): string => {
  const ru = {
    [WorkerRole.CORRECTIONS_OFFICER]: "Сотрудник наказаний",
    [WorkerRole.SURVEILLANCE_OFFICER]: "Сотрудник слежки",
    [UserRole.MANAGER]: "Менеджер",
    [UserRole.CLIENT]: "Клиент",
    [UserRole.SENIOR_MANAGER]: "Старший менеджер",
    // [UserRole.SURVEILLANCE_OFFICER]: "Сотрудник слежки",
    // [UserRole.CORRECTIONS_OFFICER]: "Сотрудник наказаний"
  };
  return ru[s];
};

export const morph = (count: number, words: string[]): string => {
  words = words || ["", "а", "ов"];
  const value = Math.abs(count) % 100;
  var num = value % 10;
  if (value > 10 && value < 20) return words[2];
  if (num > 1 && num < 5) return words[1];
  if (num == 1) return words[0];
  return words[2];
};

export const ru = {
  // Authentication
  auth: {
    signIn: "Вход",
    signUp: "Зарегистрироваться",
    register: "Регистрация",
    enterCredentials:
      "Введите свои учетные данные для доступа к вашей учетной записи",
    username: "Имя пользователя",
    password: "Пароль",
    forgotPassword: "Забыли пароль?",
    dontHaveAccount: "У вас нет учетной записи?",
    alreadyHaveAccount: "Уже есть учетная запись?",
    loginFailed: "Ошибка входа",
  },

  // Registration
  register: {
    title: "Создать учетную запись клиента",
    description: "Зарегистрируйтесь как новый клиент в системе",
    name: "Имя",
    enterFirstName: "Введите ваше имя",
    surname: "Отчество",
    middleName: "Отчество",
    lastName: "Фамилия",
    familyName: "Фамилия",
    email: "Электронная почта",
    enterEmail: "your.email@example.com",
    confirmPassword: "Подтвердить пароль",
    repeatPassword: "Повторите ваш пароль",
    minimumChars: "Минимум 6 символов",
    passwordsMismatch: "Пароли не совпадают",
    passwordTooShort: "Пароль должен быть не менее 6 символов",
    fillAllFields: "Пожалуйста, заполните все обязательные поля",
    accountExists:
      "Учетная запись с этим адресом электронной почты уже существует. Пожалуйста, используйте другой адрес электронной почты или попробуйте войти.",
    registrationFailed: "Ошибка регистрации. Пожалуйста, попробуйте снова.",
    accountCreated: "Учетная запись создана!",
    creatingAccount: "Создание учетной записи клиента",
    accountCreatedSuccess:
      "Учетная запись успешно создана! Перенаправление на вход...",
  },

  // Reset Password
  resetPassword: {
    title: "Сброс пароля",
    enterNewPassword: "Введите новый пароль ниже",
    newPassword: "Новый пароль",
    invalidLink: "Недействительная ссылка сброса",
    missingToken: "Недействительная ссылка сброса. Отсутствует токен.",
    invalidToken:
      "Недействительный или истекший токен сброса. Пожалуйста, запросите новый сброс пароля.",
    resetFailed: "Не удалось сбросить пароль. Пожалуйста, попробуйте снова.",
    successful: "Сброс пароля выполнен успешно",
    redirectingToLogin: "Перенаправление на вход...",
    backToLogin: "Вернуться на вход",
    resetPasswordButton: "Сброс пароля",
  },

  // Profile
  profile: {
    title: "Параметры учетной записи",
    description:
      "Управляйте информацией об учетной записи и параметрами безопасности",
    backToDashboard: "Вернуться",
    profileInfo: "Информация профиля",
    updateProfileInfo: "Обновите информацию об учетной записи и личные данные",
    security: "Безопасность",
    profileUpdatedSuccess: "Профиль успешно обновлен!",
    changePassword: "Изменить пароль",
    // updatePasswordToProtect: "Обновите пароль, чтобы защитить вашу учетную запись",
    passwordUpdatedSuccess: "Пароль успешно обновлен!",
    emailAddress: "Адрес электронной почты",
    enterEmail: "Введите ваш адрес электронной почты",
    firstName: "Имя",
    enterFirstName: "Введите ваше имя",
    lastName: "Фамилия",
    enterLastName: "Введите вашу фамилию",
    middleName: "Отчество",
    enterMiddleName: "Введите ваше отчество",
    currentPassword: "Текущий пароль",
    enterCurrentPassword: "Введите ваш текущий пароль",
    newPassword: "Новый пароль",
    enterNewPassword: "Введите ваш новый пароль",
    confirmNewPassword: "Подтвердите ваш новый пароль",
    confirmYourNewPassword: "Подтвердите ваш новый пароль",
    updating: "Обновление...",
    saveChanges: "Сохранить изменения",
    updatePassword: "Обновить пароль",
    errors: {
      invalidEmail: "Недействительный адрес электронной почты",
      firstNameRequired: "Имя обязательно",
      lastNameRequired: "Фамилия обязательна",
      middleNameRequired: "Отчество обязательно",
      currentPasswordRequired: "Текущий пароль обязателен",
      passwordTooShort: "Пароль должен быть не менее 6 символов",
      confirmPassword: "Пожалуйста, подтвердите ваш пароль",
      passwordsMismatch: "Пароли не совпадают",
      emailExists:
        "Учетная запись с этим адресом электронной почты уже существует",
      updateFailed:
        "Не удалось обновить профиль. Пожалуйста, попробуйте снова.",
      passwordUpdateFailed:
        "Не удалось обновить пароль. Пожалуйста, попробуйте снова.",
      incorrectPassword: "Текущий пароль неверен",
    },
  },

  // Dashboard
  dashboard: {
    clientManagement: "Управление клиентами",
    viewAndManage: "Просмотр и управление назначенными вам клиентами",
    noClientsAssigned: "К вам не назначены клиенты",
    myWorkSchedule: "Мой рабочий график",
    weeklySchedule: "Ваш еженедельный рабочий график и распределение времени",
    workDay: "Рабочий день",
    dayOff: "День отдыха",
    clientMonitoringSchedule: "Расписание слежки за клиентами",
    weeklyMonitoringSchedule:
      "Еженедельный график слежки за каждым клиентом с назначенными сотрудниками",
    pendingContracts: "Ожидаемые договоры",
    contractsWaitingApproval:
      "Договоры, их статусы и доступные действия",
    noContractsAssigned: "К вам не назначены договоры клиентов",
    staffManagement: "Управление персоналом",
    manageSchedules:
      "Управляйте расписанием сотрудников и менеджеров, а также создавайте новые учетные записи",
    createAccount: "Создать учетную запись",
    noEmployeesAssigned: "К вам не назначены сотрудники",
    deviceManagement: "Управление устройствами",
    monitorAndManage:
      "Контролируйте и управляйте устройствами мониторинга клиентов",
    registerNewDevice: "Зарегистрировать новое устройство",
    noDevicesAvailable: "Нет доступных или назначенных устройств",
    allOfficerTasks: "Все задачи сотрудников",
    allPunishmentTasks:
      "Просмотр всех задач наказания и задач замены устройств, назначенных сотрудникам наказания",
    noTasks: "Ваши сотрудники не имеют задач",
    staffRelations: "Связи сотрудников",
  },

  // Tables
  table: {
    name: "Имя",
    email: "Электронная почта",
    violations: "Нарушения",
    threshold: "Пороговое значение",
    actions: "Действия",
    contract: "Договор",
    createDate: "Дата создания",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    status: "Статус",
    client: "Клиент",
    device: "Устройство",
    assignedClient: "Назначенный клиент",
    assignmentStatus: "Статус назначения",
    batteryLevel: "Уровень заряда",
    role: "Роль",
    notSpecified: "Не указано",
    openEnded: "Открытый",
    unassigned: "Не назначено",
    unknown: "Неизвестно",
    active: "Активен",
    inactive: "Неактивен",
    off: "Выключено",
  },

  // Buttons
  button: {
    viewDetails: "Просмотр деталей",
    edit: "Редактировать",
    editSchedule: "Редактировать расписание",
    signContract: "Подписать договор",
    sendToClient: "Отправить клиенту",
    cancel: "Отмена",
    submit: "Отправить",
    save: "Сохранить",
    delete: "Удалить",
    close: "Закрыть",
    back: "Назад",
    next: "Далее",
    previous: "Назад",
    updating: "Обновление...",
    loading: "Загрузка...",
    registerViolation: "Зарегистрировать нарушение",
    registering: "Регистрация...",
    registerPunishmentTask: "Зарегистрировать задачу наказания",
    saveChanges: "Сохранить изменения",
    updatePassword: "Обновить пароль",
    unassign: "Отвязать",
    unassigning: "Удаление назначения...",
    unassignDevice: "Отвязать устройство",
    saving: "Сохранение...",
    createAccount: "Создать аккаунт",
  },

  // Modals
  modal: {
    forgotPassword: "Восстановить пароль",
    enterEmailForRecovery:
      "Введите адрес электронной почты, чтобы получить инструкции по восстановлению пароля",
    recoveryEmailSent: "Письмо с восстановлением отправлено",
    checkEmailForRecovery:
      "Проверьте свою электронную почту для получения инструкций по восстановлению пароля",
    sendRecoveryEmail: "Отправить письмо восстановления",
    recoveryFailed:
      "Не удалось запросить сброс пароля. Пожалуйста, попробуйте снова.",
    taskDetails: "Детали задачи",
    deviceChange: "Замена устройства",
    punishmentTask: "Задача наказания",
    taskType: "Тип задачи",
    clientInformation: "Информация о клиенте",
    clientId: "ID клиента",
    oldDevice: "Старое устройство",
    newDevice: "Новое устройство",
    oldDeviceId: "ID старого устройства",
    newDeviceId: "ID нового устройства",
    timeline: "Хронология",
    created: "Создано",
    dueDate: "Дата выполнения",
    lastUpdated: "Последнее обновление",
    done: "Выполнено",
    completed: "Завершено",
    clientGeolocation: "Геолокация клиента",
    lastKnownLocation: "Последнее известное местоположение",
    cancelTask: "Отменить задачу",
    sureCancel:
      "Вы уверены, что хотите отменить эту задачу? Это действие не может быть отменено.",
    keepTask: "Оставить задачу",
    cancelling: "Отмена...",
    clientDetails: "Детали клиента",
    overdue: "Просрочено",
  },

  // Validation & Forms
  form: {
    required: "Обязательно",
    optional: "Дополнительно",
    selectFile: "Выберите файл",
    fileSelected: "Выбранный файл: {name}",
    currentFile: "Текущий файл: {filepath}",
    pleaseSelectFile: "Пожалуйста, выберите файл для загрузки",
    contractDetails: "Детали договора",
    enterContractDetails: "Введите детали и описание договора",
    newFileSelected: "Выбран новый файл: {name}",
  },

  // Navigation
  navigation: {
    dashboard: "Панель инструментов",
    clients: "Клиенты",
    contracts: "Договоры",
    violations: "Нарушения",
    tasks: "Задачи",
    monitoring: "Мониторинг",
    staff: "Персонал",
    devices: "Устройства",
    allTasks: "Все задачи",
    staffRelations: "Связи сотрудников",
    profileSettings: "Параметры профиля",
    logout: "Выход",
    home: "Главная",
  },

  // Roles
  roles: {
    client: "Клиент",
    manager: "Менеджер",
    surveillanceOfficer: "Сотрудник слежки",
    correctionsOfficer: "Сотрудник наказаний",
  },

  // Status
  status: {
    active: "Активен",
    inactive: "Неактивен",
    signed: "Подписано",
    created: "Создано",
    sendToClient: "Отправить клиенту",
    pending: "В ожидании",
    expired: "Истекший",
    inProgress: "В процессе",
    done: "Выполнено",
    cancelled: "Отменено",
    assigned: "Назначено",
  },

  // Notifications
  notifications: {
    title: "Уведомления",
    markAllRead: "Прочитать все",
    noNotifications: "Нет уведомлений",
    justNow: "Только что",
    minutesAgo: "минут назад",
    hoursAgo: "часов назад",
    daysAgo: "дней назад",
    justNowSimple: "Только что",
    markAllAsRead: "Прочитать все",
  },

  // Errors
  error: {
    failed: "Не удалось",
    tryAgain: "Пожалуйста, попробуйте снова.",
    loadFailed: "Не удалось загрузить данные",
    loadFailedColon: "Не удалось загрузить данные:",
    contactAdmin: "Пожалуйста, свяжитесь с администратором.",
    unknownRole: "Неизвестная роль",
    roleNotRecognized:
      "Ваша роль пользователя не распознана. Пожалуйста, свяжитесь с администратором.",
    notFound: "Не найдено",
    pageNotFound: "Упс! Страница не найдена",
    returnHome: "Вернуться на главную",
    invalidEmail: "Недействительный адрес электронной почты",
    cantReassignWorker:
      "Невозможно переназначить этого сотрудника, потому что у него есть активное расписание слежки. Пожалуйста, попросите ответственного менеджера изменить расписание.",
  },

  // Success messages
  success: {
    updated: "Успешно обновлено!",
    created: "Успешно создано!",
    deleted: "Успешно удалено!",
    contractUpdated: "Договор успешно обновлен!",
    accountCreated: "Учетная запись успешно создана!",
    taskRegistered:
      "Задача наказания успешно зарегистрирована для {name} {surname}",
    fileUploaded: "Файл успешно загружен!",
  },

  // Weekdays
  weekday: {
    monday: "Пн",
    tuesday: "Вт",
    wednesday: "Ср",
    thursday: "Чт",
    friday: "Пт",
    saturday: "Сб",
    sunday: "Вс",
  },

  // UI
  ui: {
    previous: "Назад",
    next: "Далее",
    more: "Больше",
    toggleSidebar: "Переключить боковую панель",
    pagination: "Нумерация страниц",
    breadcrumb: "Макет хлебных крошек",
    goToPreviousPage: "Перейти на предыдущую страницу",
    goToNextPage: "Перейти на следующую страницу",
    close: "Закрыть",
    morePages: "Больше страниц",
    previousSlide: "Предыдущий слайд",
    nextSlide: "Следующий слайд",
    toggleSidebarSrOnly: "Переключить боковую панель",
  },

  // Hero
  hero: {
    system: "Система",
    tracksHabits: "Отслеживает ваши привычки",
  },

  // Footer
  footer: {
    copyright: '2025 Корпорация "Бросайте курить!"',
  },

  // Penalties
  penalties: {
    registerPunishmentTask: "Зарегистрировать задачу наказания",
    confirmRegisterTask:
      "Вы уверены, что хотите зарегистрировать задачу наказания для {name} {surname}?",
    describeBrokenHabit: "Опишите, как именно клиент нарушил привычку...",
    nextStep:
      "Далее будет создана новая задача наказания и назначена сотруднику наказания для исполнения.",
  },

  // Contracts
  contract: {
    newContract: "Создать новый договор",
    fillDetailsCreateRequest:
      "Заполните детали для создания нового запроса договора",
    uploadingFile: "Загрузка файла...",
    creatingContract: "Создание договора...",
    createNewContract: "Создать новый договор",
    editContract: "Редактировать договор",
    updateContractDates: "Обновить детали договора, даты и файл.",
    updating: "Обновление...",
    updateContract: "Обновить договор",
    endDateAfterStart: "Дата окончания должна быть после даты начала",
    contractDetails: "Детали договора",
    fileUploadError: "Не удалось загрузить файл",
    pleaseSelectFile: "Пожалуйста, выберите файл для загрузки",
    provideDetails: "Пожалуйста, предоставьте детали договора",
    provideStartDate: "Пожалуйста, укажите дату начала",
    createFailed: "Не удалось создать договор",
    updateFailed: "Не удалось обновить договор",
    fetchFailed: "Не удалось получить договоры",
    enterContractDetails: "Введите детали и описание договора",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    contractFile: "Документ, подтверждающий личность",
    selectNew: "Выберите новый файл",
    currentFile: "Текущий файл: {name}",
    selectedFile: "Выбранный файл: {name}",
  },

  // Devices
  device: {
    registrationTitle: "Регистрация устройства",
    registerNewDevice: "Зарегистрировать новое устройство",
    registeringDevice: "Регистрация устройства...",
    deviceId: "ID устройства",
    enterDeviceId: "Введите ID устройства",
    details: "Детали устройства",
    deviceDetails: "Устройство № {id} - Детали",
    properties: "Свойства устройства",
    assignedClient: "Назначенный клиент",
    unassigned: "Не назначено",
    batteryLevel: "Уровень заряда",
    replaceDevice: "Заменить устройство",
    metrics: "Метрики устройства",
    readings: "{count} показаний",
    selectTimeRange: "Выберите диапазон времени",
    noMetricsData: "Нет данных метрик для этого устройства",
    metricValue: "Значение метрики",
    geolocation: "Геолокация устройства",
    lastKnownLocation: "Последнее известное местоположение",
    replaceDeviceTask: "Задача замены устройства",
    selectReplacementDevice: "Выберите устройство для замены",
    chooseReplacementDevice: "Выберите устройство для замены",
    noAvailableDevices: "Нет доступных устройств",
    noOfficersAvailable: "Нет доступных сотрудников",
    assignToOfficer: "Назначить сотруднику",
    selectOfficer: "Выберите сотрудника",
    creatingTask: "Создание...",
    createReplacementTask: "Создать задачу замены",
    already_exists: "Устройство с этим ID уже существует",
    invalid_id: "Неверный ID устройства",
    failedToRegister:
      "Не удалось зарегистрировать устройство. Пожалуйста, попробуйте снова.",
    failedToLoad:
      "Не удалось загрузить данные устройства. Пожалуйста, попробуйте снова.",
    failedToCreateReplacement:
      "Не удалось создать задачу замены устройства. Пожалуйста, попробуйте снова.",
  },

  // Schedule
  schedule: {
    selectSchedule: "Выберите расписание",
    isWorkDay: "Это рабочий день",
    startTime: "Время начала",
    endTime: "Время окончания",
    invalidTimeRange:
      "Неверный диапазон времени: время окончания должно быть после времени начала",
    savingSchedule: "Сохранение расписания...",
    saveSchedule: "Сохранить расписание",
    failedSaveSchedule: "Не удалось сохранить расписание",
  },

  // Time Ranges
  timeRange: {
    last5Minutes: "Последние 5 минут",
    last30Minutes: "Последние 30 минут",
    last1Hour: "Последний час",
    last1Day: "Последний день",
  },

  // Task Types
  taskType: {
    deviceChange: "Замена устройства",
    punishmentTask: "Задача наказания",
  },

  // Monitoring
  monitoring: {
    monitoringSlot: "Интервал мониторинга",
    monitoringSlots: "{count} интервал{ending} слежки",
    clash: "Конфликт",
    clashes: "{count} конфликтов",
    hide: "Скрыть",
    view: "Просмотр",
    monitoringSchedule: "Расписание слежки",
    monitoringScheduleTitle: "Расписание слежки - {name}",
    monitoringScheduleDescription:
      "Настройте временные интервалы слежки за клиентом по дням недели",
    startTime: "Начало",
    endTime: "Конец",
    monitoringOfficer: "Сотрудник слежки",
    selectOfficer: "Выберите сотрудника",
    add: "Добавить",
    noMonitoringScheduled: "Для этого дня расписание не задано",
    slots: "слотов",
    saving: "Сохранение...",
    saveSchedule: "Сохранить расписание",
    failedToLoadSchedule: "Не удалось загрузить расписание",
    intervalClashDetected:
      "Обнаружено пересечение интервалов: два или более интервала слежки перекрываются в один день. Пожалуйста, отрегулируйте диапазоны времени.",
    intervalClash:
      "Пересечение интервалов: выбранные диапазоны времени перекрываются. Пожалуйста, отрегулируйте и попробуйте снова.",
    selectMonitoringOfficer:
      "Пожалуйста, выберите сотрудника мониторинга для всех временных слотов",
    failedToSaveSchedule: "Не удалось сохранить расписание",
  },

  // Validation
  validation: {
    required: "Обязательное поле",
    idRequired: "ID обязателен",
    selectReplacementAndOfficer:
      "Пожалуйста, выберите устройство для замены и сотрудника",
    provideContractDetails: "Пожалуйста, предоставьте детали договора",
    provideStartDate: "Пожалуйста, укажите дату начала",
    endDateAfterStart: "Дата окончания должна быть после даты начала",
    notSpecified: "Не указано",
    openEnded: "Открытый",
    thresholdBetweenRange: "Пороговое значение должно быть между 0 и 100",
    thresholdCannotExceed: "Пороговое значение не может превышать 100",
  },

  // Miscellaneous UI
  misc: {
    signerId: "ID подписывающего лица: {id}",
    officer: "Офицер (ID: {id})",
    device: "Устройство",
    deviceDetails: "Детали устройства",
    battery: "Батарея",
    accountType: "Выберите тип учетной записи",
    employeeCorrectionsOfficer: "Сотрудник наказаний",
    employeeSurveillanceOfficer: "Сотрудник слежки",
    managerRole: "Менеджер",
    onlySeniorCanCreateManager:
      "Только старшие менеджеры могут создавать учетные записи менеджеров",
    enterEmailAddress: "Введите адрес электронной почты",
    enterFirstNamePlaceholder: "Имя",
    enterLastNamePlaceholder: "Фамилия",
    enterMiddleNamePlaceholder: "Отчество",
    creatingAccount: "Создание учетной записи...",
    toggleSidebar: "Переключить боковую панель",
    goToPreviousPage: "Перейти на предыдущую страницу",
    goToNextPage: "Перейти на следующую страницу",
    morePages: "Больше страниц",
    noTasksAssigned: "К вашим работникам не назначены задачи",
    appTitle: "SPY+",
    user: "Пользователь",
    emailAddress: "Адрес электронной почты",
    enterYourEmail: "Введите вашу электронную почту",
    firstName: "Имя",
    enterYourFirstName: "Введите ваше имя",
    lastName: "Фамилия",
    enterYourLastName: "Введите вашу фамилию",
    middleName: "Отчество",
    enterYourMiddleName: "Введите ваше отчество",
    currentPassword: "Текущий пароль",
    enterYourCurrentPassword: "Введите ваш текущий пароль",
    newPassword: "Новый пароль",
    enterYourNewPassword: "Введите ваш новый пароль",
    confirmNewPassword: "Подтвердите новый пароль",
    confirmYourNewPassword: "Подтвердите ваш новый пароль",
    profileUpdatedSuccessfully: "Профиль успешно обновлен!",
    passwordUpdatedSuccessfully: "Пароль успешно обновлен!",
    changePassword: "Изменить пароль",
    updatePasswordToKeepAccountSecure:
      "Обновите пароль, чтобы защитить вашу учетную запись",
    currentSettings: "Текущие параметры",
    reviewAndUpdateMetricThreshold:
      "Просмотрите и обновите пороговое значение метрики для клиента",
    clientId: "ID клиента",
    email: "Электронная почта",
    violationsCount: "Количество нарушений",
    currentThreshold: "Текущий порог",
    setMetricThreshold: "Задать новое пороговое значение метрики",
    adjustThresholdValue:
      "Отрегулируйте пороговое значение для мониторинга этого клиента. Более высокие значения означают большую допустимость перед срабатыванием предупреждений",
    currentValue: "Текущее значение",
    assignedDevices: "Назначенные устройства",
    manageDevicesAssignedToThisClient:
      "Управляйте устройствами, назначенными этому клиенту. Удаление назначения устройства сделает его доступным для других клиентов.",
    noDevicesAssignedToThisClient: "Этому клиенту не назначены устройства",
    availableDevices: "Доступные устройства",
    assignAvailableDeviceToThisClient:
      "Назначьте устройство этому клиенту из пула свободных устройств",
    noUnassignedDevicesAvailable: "Нет свободных устройств",
    deviceId: "ID устройства",
    batteryLevel: "Уровень заряда",
    status: "Статус",
    assignment: "Назначение",
    actions: "Действия",
    assignmentStatus: "Статус назначения",
    assignedToClient: "Назначено клиенту",
    confirmDeviceUnassignment: "Подтвердите удаление назначения устройства",
    areYouSureUnassignDevice:
      "Вы уверены, что хотите удалить назначение устройства #{deviceId} от {name} {surname}? Устройство станет доступным для других клиентов.",
    metricThreshold: "Пороговое значение метрики",
    watchers: "Наблюдатели",
    clientManagement: "Управление клиентом",
    manageMetricThresholdSettingsDeviceAssignments:
      "Управляйте параметрами порога метрики, назначениями устройств",
    assigning: "Назначение...",
    assign: "Назначить",
    cancelDeviceChangeTaskToAssignThisDeviceDirectly:
      "Отмените задачу изменения устройства, чтобы назначить это устройство напрямую",
    assignedWatchers: "Назначенные сотрудники слежки",
    surveillanceOfficersAssignedDescription:
      "Сотрудники слежки, назначенные для мониторинга этого клиента. Удаление сотрудника слежки исключит его из мониторинга этого клиента.",
    noWatchersAssignedToThisClient: "Этому клиенту не назначены сотрудники слежки",
    watcherName: "Имя сотрудника слежки",
    role: "Роль",
    removing: "Удаление...",
    remove: "Удалить",
    confirmWatcherRemoval: "Подтвердите удаление сотрудника слежки",
    areYouSureRemoveWatcher:
      "Вы уверены, что хотите удалить {name} {surname} в качестве сотрудника слежки для {clientName} {clientSurname}? Они больше не будут следить за этим клиентом.",
    removeWatcher: "Удалить сотрудника слежки",
    notAssignedToYouPleaseContact: "Не назначено вам, пожалуйста, свяжитесь с",
    assignWorkerToSomeManager: "Назначьте рабочего какому-нибудь менеджеру",
    saveThreshold: "Сохранить",
    clientDetails: "Детали клиента",
    clientInformation: "Информация о клиенте",
    clientGeolocation: "Геолокация клиента",
    lastKnownLocation: "Последнее известное местоположение:",
    name: "Имя:",
    clientIdLabel: "ID клиента:",
  },

  // Weekdays (for getDayName function)
  days: {
    monday: "Пн",
    tuesday: "Вт",
    wednesday: "Ср",
    thursday: "Чт",
    friday: "Пт",
    saturday: "Сб",
    sunday: "Вс",
  },

  // Task management
  taskManagement: {
    updateTaskStatus: "Обновить статус задачи",
    updateDeviceChangeTask: "Обновить задачу замены устройства #{id}",
    updatePunishmentTask: "Обновить задачу наказания #{id}",
    taskInformation: "Информация о задаче",
    client: "Клиент",
    oldDevice: "Старое устройство",
    newDevice: "Новое устройство",
    created: "Создано",
    notAvailable: "Недоступно",
    doneDate: "Дата завершения",
    thisTaskWillBeMarkedAsCompletedOn:
      "Эта задача будет отмечена как выполненная:",
    updating: "Обновление...",
    updateStatus: "Обновить статус",
    tasks: "Задачи",
    monitorAndUpdate:
      "Отслеживайте и обновляйте задачи наказания и замены устройств",
    noTasksFound: "Задачи не найдены.",
    task: "Задача",
    type: "Тип",
    deviceChange: "Замена устройства",
    punishmentTask: "Задача наказания",
    clientId: "ID клиента",
    deviceChangeFormat: "Устройство #{oldId} → #{newId}",
    allTasks: "Все задачи",
    new: "Новые",
    inProgress: "В процессе",
    done: "Выполнено",
    cancelled: "Отменено",
    completed: "Завершено",
    na: "Недост.",
  },

  // Form validation and errors
  formErrors: {
    invalidEmail: "Неверный адрес электронной почты",
    firstNameRequired: "Имя обязательно",
    lastNameRequired: "Фамилия обязательна",
    middleNameRequired: "Отчество обязательно",
    currentPasswordRequired: "Текущий пароль обязателен",
    passwordTooShort: "Пароль должен быть не менее 6 символов",
    confirmPassword: "Пожалуйста, подтвердите ваш пароль",
    passwordsMismatch: "Пароли не совпадают",
    failedToFetchContracts: "Не удалось получить договоры",
    failedToUploadFile: "Не удалось загрузить файл",
    pleaseSelectFile: "Пожалуйста, выберите файл для загрузки",
    pleaseProvideContractDetails: "Пожалуйста, предоставьте детали договора",
    pleaseProvideStartDate: "Пожалуйста, укажите дату начала",
    endDateAfterStart: "Дата окончания должна быть после даты начала",
    failedToCreateContract: "Не удалось создать договор",
    failedToSignContract: "Не удалось подписать договор",
    failedToEditContract: "Не удалось отредактировать договор",
    unknownRole: "Неизвестная роль",
    yourRoleIsNotRecognized:
      "Ваша роль пользователя не распознана. Пожалуйста, свяжитесь с администратором.",
  },

  // Contract management
  contractManagement: {
    createNewContract: "Создать новый договор",
    fillDetailsToCreate:
      "Заполните детали для создания нового запроса договора",
    editContractId: "Редактировать договор #{id}",
    updateDetails: "Обновите детали договора, даты и файл.",
    contract: "Договор",
    createDate: "Дата создания",
    startDate: "Дата начала",
    endDate: "Дата окончания",
  },

  // Monitoring Schedule
  monitoringSchedule: {
    title: "График мониторинга - {name}",
    description:
      "Настройте временные интервалы мониторинга для клиента по дням недели",
    slots: "{count} слотов мониторинга",
    addSlot: "Добавить",
    startTime: "Время начала",
    endTime: "Время окончания",
    monitoringOfficer: "Сотрудник слежки",
    selectOfficer: "Выберите сотрудника",
    noMonitoringScheduled: "Для этого дня не запланирован мониторинг",
    cancel: "Отмена",
    saving: "Сохранение...",
    saveSchedule: "Сохранить расписание",
    failedToLoadSchedule: "Не удалось загрузить расписание",
    intervalClashDetected:
      "Обнаружено пересечение интервалов: два или более интервала слежки перекрываются в один день. Пожалуйста, отрегулируйте диапазоны времени.",
    selectMonitoringOfficer:
      "Пожалуйста, выберите сотрудника мониторинга для всех временных слотов",
    failedToSaveSchedule: "Не удалось сохранить расписание",
    intervalClashOverlap:
      "Пересечение интервалов: выбранные диапазоны времени перекрываются. Пожалуйста, отрегулируйте и попробуйте снова.",
  },

  // Threshold Modal
  thresholdModal: {
    thresholdBetween: "Пороговое значение должно быть между 0 и 100",
    thresholdNotExceed: "Пороговое значение не может превышать 100",
    failedToLoadDevices: "Не удалось загрузить устройства",
    failedToUpdateThreshold: "Не удалось обновить пороговое значение метрики",
    failedToUnassignDevice: "Не удалось удалить назначение устройства",
    failedToAssignDevice: "Не удалось назначить устройство",
    failedToAssignWatcher: "Не удалось назначить сотрудника слежки",
    failedToUnassignWatcher: "Не удалось удалить назначение сотрудника слежки",
    deviceId: "Устройство #{id}",
    active: "Активно",
    inactive: "Неактивно",
    off: "Выключено",
    availableWatchers: "Доступные сотрудники слежки",
    availableWatchersDescription:
      "Назначьте сотрудников слежки для мониторинга этого клиента из пула доступных сотрудников.",
    noAvailableOfficers: "Нет доступных сотрудников сотрудников слежки",
    watcherName: "Имя сотрудника слежки",
    email: "Электронная почта",
    role: "Роль",
    actions: "Действия",
    assigning: "Назначение...",
    assign: "Назначить",
    clientId: "ID клиента:",
    devicesAssigned: "{count} устройств назначено",
    available: "доступно",
  },

  // Surveillance Officer Dashboard
  surveillanceOfficer: {
    clientList: "Список клиентов",
    monitoringSchedule: "График мониторинга",
    myWorkSchedule: "Мой рабочий график",
    weeklyScheduleDesc:
      "Ваш еженедельный рабочий график и распределение времени",
    workDay: "Рабочий день",
    dayOff: "День отдыха",
    violations: "Нарушения",
    registerViolationsTasks:
      "Зарегистрировать задачи наказания для клиентов при необходимости",
    violationCount: "Количество нарушений",
    metricThreshold: "Пороговое значение метрики",
    registerViolation: "Зарегистрировать нарушение",
    registerPunishmentTask: "Зарегистрировать задачу наказания",
    confirmRegisterTask:
      "Вы уверены, что хотите зарегистрировать задачу наказания для {name} {surname}?",
    describeHabitBreach: "Опишите, как именно клиент нарушил привычку...",
    nextStep:
      "Далее будет создана новая задача наказания и назначена сотруднику наказания для исполнения.",
    failedToLoadClients: "Не удалось загрузить клиентов",
    failedToRegisterTask: "Не удалось зарегистрировать задачу наказания",
    registering: "Регистрация...",
  },

  // Dashboard general
  dashboardGeneral: {
    unknownRole: "Неизвестная роль",
    roleNotRecognized:
      "Ваша роль пользователя не распознана. Пожалуйста, свяжитесь с администратором.",
  },

  // Manager Dashboard
  managerDashboard: {
    nameRequired: "Имя обязательно",
    firstNameRequired: "Имя обязательно",
    lastNameRequired: "Фамилия обязательна",
    middleNameRequired: "Отчество обязательно",
    clientList: "Список клиентов",
    registerViolationTasks:
      "Зарегистрировать задачи наказания для клиентов при необходимости",
    contract: "Договор",
    createDate: "Дата создания",
    startDate: "Дата начала",
    endDate: "Дата окончания",
    status: "Статус",
    client: "Клиент",
    contractId: "Договор #{id}",
    notSpecified: "Не указано",
    noEmployeesAssigned: "К вам не назначены сотрудники",
    name: "Имя",
    email: "Электронная почта",
    role: "Роль",
    deviceId: "Устройство #{id}",
    deviceListBattery: "Устройство #{id} (Батарея: {battery}%)",
  },

  // Device Replacement Modal
  deviceReplacement: {
    battery: "Батарея",
  },
};

export type TranslationKeys = typeof ru;
