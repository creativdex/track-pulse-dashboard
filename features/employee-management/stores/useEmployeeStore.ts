import { defineStore } from "pinia";
import type {
  IEmployeeWithChanges,
  ITrackerProject,
  ITrackerQueue,
} from "../schemas/employeeSchema";
import { EUserTrackerRateType } from "../schemas/employeeSchema";
import {
  getEmployees,
  getEmployeesByRateType,
  updateRatesWithTypes,
  getProjects,
  getQueues,
} from "../api/client";

export const useEmployeeStore = defineStore("employee", () => {
  // State
  const employees = ref<IEmployeeWithChanges[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);

  // Новые справочники для типов ставок
  const projects = ref<ITrackerProject[]>([]);
  const queues = ref<ITrackerQueue[]>([]);
  const loadingLookups = ref(false);

  // Computed
  const employeesWithChanges = computed(() =>
    employees.value.filter((emp) => emp.hasChanges)
  );

  const changesCount = computed(() => employeesWithChanges.value.length);

  const hasUnsavedChanges = computed(() => changesCount.value > 0);

  // Статистика на основе текущих данных сотрудников
  const stats = computed(() => {
    const total = employees.value.length;
    const withSalary = employees.value.filter(
      (emp) => emp.rate !== null && emp.rate !== undefined
    );
    const totalSalary = withSalary.reduce(
      (sum, emp) => sum + (emp.rate || 0),
      0
    );

    return {
      total,
      withSalary: withSalary.length,
      withoutSalary: total - withSalary.length,
      averageSalary:
        withSalary.length > 0 ? Math.round(totalSalary / withSalary.length) : 0,
    };
  });

  // Actions
  async function loadEmployees(includeAll = false) {
    loading.value = true;
    error.value = null;

    try {
      const data = await getEmployees(includeAll);

      employees.value = data.map((emp) => ({
        ...emp,
        rate:
          emp.rate !== null && emp.rate !== undefined ? Number(emp.rate) : null,
        newRate: undefined,
        hasChanges: false,
        isEditing: false,
        newSalaryInput: undefined,
        newDirectRate: undefined,
      }));
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Ошибка загрузки сотрудников";
    } finally {
      loading.value = false;
    }
  }

  // Загрузка сотрудников по типу ставки
  async function loadEmployeesByRateType(
    rateType: EUserTrackerRateType,
    context?: string,
    includeAll = false
  ) {
    loading.value = true;
    error.value = null;

    try {
      const data = await getEmployeesByRateType(rateType, context, includeAll);

      employees.value = data.map((emp) => ({
        ...emp,
        rate:
          emp.rate !== null && emp.rate !== undefined ? Number(emp.rate) : null,
        newRate: undefined,
        hasChanges: false,
        isEditing: false,
        newSalaryInput: undefined,
        newDirectRate: undefined,
      }));
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Ошибка загрузки сотрудников по типу ставки";
    } finally {
      loading.value = false;
    }
  }

  // Новые методы для загрузки справочников
  async function loadLookups() {
    loadingLookups.value = true;
    error.value = null;

    try {
      const [projectsData, queuesData] = await Promise.all([
        getProjects(),
        getQueues(),
      ]);

      projects.value = projectsData;
      queues.value = queuesData;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Ошибка загрузки справочников";
      console.error("Ошибка загрузки справочников:", err);
    } finally {
      loadingLookups.value = false;
    }
  }

  function startEditing(employeeId: string) {
    const employee = employees.value.find((emp) => emp.id === employeeId);
    if (employee) {
      employee.isEditing = true;
      employee.newRate = employee.rate || 0;
    }
  }

  function cancelEditing(employeeId: string) {
    const employee = employees.value.find((emp) => emp.id === employeeId);
    if (employee) {
      employee.isEditing = false;
      employee.newRate = undefined;
      employee.hasChanges = false;
    }
  }

  function updateEmployeeRate(employeeId: string, newRate: number) {
    const employee = employees.value.find((emp) => emp.id === employeeId);
    if (employee) {
      employee.newRate = newRate;
      employee.hasChanges = newRate !== employee.rate;
      employee.isEditing = true;
    }
  }

  function applyChange(employeeId: string) {
    const employee = employees.value.find((emp) => emp.id === employeeId);
    if (employee && employee.newRate !== undefined) {
      employee.isEditing = false;
      // Изменения остаются до сохранения
    }
  }

  async function saveAllChanges(rateType: EUserTrackerRateType = EUserTrackerRateType.GLOBAL, contextValue?: string): Promise<{ success: boolean; updated: number }> {
    if (!hasUnsavedChanges.value) return { success: true, updated: 0 };

    saving.value = true;
    error.value = null;

    try {
      const employeesWithChanges = employees.value.filter(emp => emp.hasChanges);
      
      if (employeesWithChanges.length === 0) {
        return { success: true, updated: 0 };
      }

      // Формируем массив изменений для нового API
      const changes = employeesWithChanges.map(emp => ({
        userId: emp.id,
        rate: emp.newRate!,
        comment: emp.rate === null
          ? "Установка первоначальной ставки"
          : "Изменение ставки",
      }));

      const result = await updateRatesWithTypes(changes, rateType, contextValue);

      if (result.success) {
        // Применяем изменения к локальным данным
        employeesWithChanges.forEach((emp) => {
          emp.rate = emp.newRate!;
          emp.newRate = undefined;
          emp.hasChanges = false;
          emp.isEditing = false;
        });

        // Статистика обновится автоматически через computed
        return result; // Возвращаем результат с количеством обновленных записей
      } else {
        throw new Error('Сохранение не удалось');
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Ошибка сохранения изменений";
      throw err; // Пробрасываем ошибку дальше
    } finally {
      saving.value = false;
    }
  }

  function discardAllChanges() {
    employees.value.forEach((emp) => {
      emp.newRate = undefined;
      emp.hasChanges = false;
      emp.isEditing = false;
    });
  }

  function clearError() {
    error.value = null;
  }

  // Форматирование валюты
  function formatCurrency(amount: number | null): string {
    if (typeof amount !== "number" || isNaN(amount)) return "не число ₽";
    if (amount === null) return "Не установлен";
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return {
    // State
    employees,
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    stats: readonly(stats),
    projects,
    queues,
    loadingLookups: readonly(loadingLookups),

    // Computed
    employeesWithChanges: readonly(employeesWithChanges),
    changesCount: readonly(changesCount),
    hasUnsavedChanges: readonly(hasUnsavedChanges),

    // Actions
    loadEmployees,
    loadEmployeesByRateType,
    loadLookups,
    startEditing,
    cancelEditing,
    updateEmployeeRate,
    applyChange,
    saveAllChanges,
    discardAllChanges,
    clearError,
    formatCurrency,
  };
});
