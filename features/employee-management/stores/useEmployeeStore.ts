import { defineStore } from 'pinia';
import type { ISalaryChange, IEmployeeWithChanges } from '../schemas/employeeSchema';
import { getEmployees, updateSalaries } from '../api/client';

export const useEmployeeStore = defineStore('employee', () => {
  // State
  const employees = ref<IEmployeeWithChanges[]>([]);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  
  // Computed
  const employeesWithChanges = computed(() => 
    employees.value.filter(emp => emp.hasChanges)
  );
  
  const changesCount = computed(() => employeesWithChanges.value.length);
  
  const hasUnsavedChanges = computed(() => changesCount.value > 0);

  // Статистика на основе текущих данных сотрудников
  const stats = computed(() => {
    const total = employees.value.length;
    const withSalary = employees.value.filter(emp => emp.rate !== null && emp.rate !== undefined);
    const totalSalary = withSalary.reduce((sum, emp) => sum + (emp.rate || 0), 0);

    return {
      total,
      withSalary: withSalary.length,
      withoutSalary: total - withSalary.length,
      averageSalary: withSalary.length > 0 ? Math.round(totalSalary / withSalary.length) : 0,
    };
  });

  // Actions
  async function loadEmployees(includeAll = false) {
    loading.value = true;
    error.value = null;
    
    try {
      const data = await getEmployees(includeAll);
      
      employees.value = data.map(emp => ({
        ...emp,
        newRate: undefined,
        hasChanges: false,
        isEditing: false,
      }));
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка загрузки сотрудников';
      console.error('Ошибка загрузки сотрудников:', err);
    } finally {
      loading.value = false;
    }
  }

  function startEditing(employeeId: string) {
    const employee = employees.value.find(emp => emp.id === employeeId);
    if (employee) {
      employee.isEditing = true;
      employee.newRate = employee.rate || 0;
    }
  }

  function cancelEditing(employeeId: string) {
    const employee = employees.value.find(emp => emp.id === employeeId);
    if (employee) {
      employee.isEditing = false;
      employee.newRate = undefined;
      employee.hasChanges = false;
    }
  }

  function updateEmployeeRate(employeeId: string, newRate: number) {
    const employee = employees.value.find(emp => emp.id === employeeId);
    if (employee) {
      employee.newRate = newRate;
      employee.hasChanges = newRate !== employee.rate;
      employee.isEditing = true;
    }
  }

  function applyChange(employeeId: string) {
    const employee = employees.value.find(emp => emp.id === employeeId);
    if (employee && employee.newRate !== undefined) {
      employee.isEditing = false;
      // Изменения остаются до сохранения
    }
  }

  async function saveAllChanges() {
    if (!hasUnsavedChanges.value) return;
    
    saving.value = true;
    error.value = null;
    
    try {
      const changes: ISalaryChange[] = employeesWithChanges.value.map(emp => ({
        employeeId: emp.id,
        newRate: emp.newRate!,
        comment: emp.rate === null ? 'Установка первоначального оклада' : 'Изменение оклада',
      }));

      const result = await updateSalaries({ changes });
      
      if (result.success) {
        // Применяем изменения к локальным данным
        employeesWithChanges.value.forEach(emp => {
          emp.rate = emp.newRate!;
          emp.newRate = undefined;
          emp.hasChanges = false;
          emp.isEditing = false;
        });
        
        // Статистика обновится автоматически через computed
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ошибка сохранения изменений';
      console.error('Ошибка сохранения изменений:', err);
    } finally {
      saving.value = false;
    }
  }

  function discardAllChanges() {
    employees.value.forEach(emp => {
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
    if (amount === null) return 'Не установлен';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
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
    
    // Computed
    employeesWithChanges: readonly(employeesWithChanges),
    changesCount: readonly(changesCount),
    hasUnsavedChanges: readonly(hasUnsavedChanges),
    
    // Actions
    loadEmployees,
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
