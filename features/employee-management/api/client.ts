import type { IEmployee, IBatchSalaryUpdate, IBatchRateUpdate, ITrackerProject, ITrackerQueue } from '../schemas/employeeSchema';
import { fetchWithAuth, handleApiError } from '../../../shared/api/utils';

// ===== МЕТОДЫ УПРАВЛЕНИЯ СОТРУДНИКАМИ =====

/**
 * Получить список всех сотрудников
 * @param includeAll - включить ли уволенных сотрудников
 * @returns Массив сотрудников
 */
export async function getEmployees(includeAll = false): Promise<IEmployee[]> {
  try {
    return await fetchWithAuth<IEmployee[]>('/users-tracker/all', {
      method: 'GET',
      query: {
        includeDismissed: includeAll.toString(),
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка загрузки сотрудников");
  }
}

/**
 * Получить список сотрудников по типу ставки
 * @param rateType - тип ставки (global, project, queue)
 * @param context - контекст для project/queue (ID проекта или название очереди)
 * @param includeAll - включить ли уволенных сотрудников
 * @returns Массив сотрудников с указанным типом ставки
 */
export async function getEmployeesByRateType(
  rateType: import('../schemas/employeeSchema').EUserTrackerRateType,
  context?: string,
  includeAll = false
): Promise<IEmployee[]> {
  try {
    const query: Record<string, string> = {
      rateType,
      includeDismissed: includeAll.toString(),
    };
    
    if (context) {
      query.context = context;
    }

    return await fetchWithAuth<IEmployee[]>('/users-tracker/by-rate-type', {
      method: 'GET',
      query,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка загрузки сотрудников по типу ставки");
  }
}

/**
 * Получить сотрудника по ID
 * @param id - ID сотрудника
 * @returns Сотрудник или null
 */
export async function getEmployeeById(id: string): Promise<IEmployee | null> {
  try {
    return await fetchWithAuth<IEmployee>(`/users-tracker/${id}`, {
      method: 'GET',
    });
  } catch (error: unknown) {
    // Если пользователь не найден, возвращаем null
    if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
      return null;
    }
    throw handleApiError(error, "Ошибка загрузки сотрудника");
  }
}

// ===== МЕТОДЫ УПРАВЛЕНИЯ СТАВКАМИ =====

/**
 * Массовое обновление ставок сотрудников (новый API с типами)
 * @param changes - Массив изменений ставок сотрудников 
 * @param rateType - Тип ставки (global, project, queue)
 * @param contextValue - Контекстное значение (ID проекта или название очереди)
 * @returns Результат операции
 */
export async function updateRatesWithTypes(
  changes: Array<{ userId: string; rate: number; comment?: string }>,
  rateType: import('../schemas/employeeSchema').EUserTrackerRateType,
  contextValue?: string
): Promise<{ success: boolean; updated: number }> {
  try {
    // Формируем данные согласно схеме
    const batchData: IBatchRateUpdate = {
      changes: changes.map(change => ({
        type: rateType,
        rate: change.rate,
        userId: change.userId,
        contextValue: contextValue,
        comment: change.comment || 'Обновление ставки',
      })),
    };

    const results = await fetchWithAuth<Array<{
      userId: string;
      success: boolean;
      error?: string;
      rateId?: string;
    }>>('/users-tracker-rate/batch', {
      method: 'POST',
      body: batchData,
    });

    // Подсчитываем успешные обновления
    const successfulUpdates = results.filter(result => result.success).length;
    const hasFailures = results.some(result => !result.success);

    // Если есть неудачные обновления, собираем ошибки
    if (hasFailures) {
      const errors = results
        .filter(result => !result.success)
        .map(result => result.error || 'Неизвестная ошибка')
        .join('; ');
      
      throw new Error(`Некоторые обновления не удались: ${errors}`);
    }

    return {
      success: true,
      updated: successfulUpdates,
    };
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка обновления ставок");
  }
}

/**
 * Массовое обновление ставок сотрудников (старый API для совместимости)
 * @param data - Данные для обновления ставок
 * @returns Результат операции
 */
export async function updateSalaries(data: IBatchSalaryUpdate): Promise<{ success: boolean; updated: number }> {
  try {
    // Преобразуем данные в формат, ожидаемый бэкендом
    const batchData = {
      changes: data.changes.map(change => ({
        employeeId: change.employeeId,
        newRate: change.newRate,
        comment: change.comment || 'Обновление ставки',
      })),
    };

    const results = await fetchWithAuth<Array<{
      employeeId: string;
      success: boolean;
      error?: string;
      rateId?: string;
    }>>('/users-tracker-rate/batch', {
      method: 'POST',
      body: batchData,
    });

    // Подсчитываем успешные обновления
    const successfulUpdates = results.filter(result => result.success).length;
    const hasFailures = results.some(result => !result.success);

    // Если есть неудачные обновления, собираем ошибки
    if (hasFailures) {
      const errors = results
        .filter(result => !result.success)
        .map(result => result.error || 'Неизвестная ошибка')
        .join('; ');
      
      throw new Error(`Некоторые обновления не удались: ${errors}`);
    }

    return {
      success: true,
      updated: successfulUpdates,
    };
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка обновления ставок");
  }
}

/**
 * Получить статистику по ставкам на основе списка сотрудников
 * @returns Статистика по ставкам сотрудников
 */
export async function getSalaryStats(): Promise<{
  total: number;
  withSalary: number;
  withoutSalary: number;
  averageSalary: number;
}> {
  try {
    // Вычисляем статистику на основе списка пользователей
    const employees = await getEmployees(false); // Только активные
    const withSalary = employees.filter(emp => emp.rate !== null && emp.rate !== undefined);
    const totalSalary = withSalary.reduce((sum, emp) => sum + (emp.rate || 0), 0);

    return {
      total: employees.length,
      withSalary: withSalary.length,
      withoutSalary: employees.length - withSalary.length,
      averageSalary: withSalary.length > 0 ? Math.round(totalSalary / withSalary.length) : 0,
    };
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка загрузки статистики");
  }
}

// ===== МЕТОДЫ ДЛЯ ПОЛУЧЕНИЯ СПРАВОЧНИКОВ =====

/**
 * Получить список всех проектов
 * @returns Массив проектов
 */
export async function getProjects(): Promise<ITrackerProject[]> {
  try {
    const projects = await fetchWithAuth<ITrackerProject[]>('/reference-tracker/projects', {
      method: 'GET',
    });
    
    return projects || [];
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка загрузки списка проектов");
  }
}

/**
 * Получить список всех очередей
 * @returns Массив очередей
 */
export async function getQueues(): Promise<ITrackerQueue[]> {
  try {
    const queues = await fetchWithAuth<ITrackerQueue[]>('/reference-tracker/queues', {
      method: 'GET',
    });
    
    return queues || [];
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка загрузки списка очередей");
  }
}
