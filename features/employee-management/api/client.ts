import type { IEmployee, IBatchSalaryUpdate } from '../schemas/employeeSchema';
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
 * Массовое обновление ставок сотрудников
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
