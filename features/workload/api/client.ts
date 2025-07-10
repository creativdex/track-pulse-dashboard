import { fetchWithAuth, handleApiError } from '../../../shared/api/utils';
import { WorkloadQuerySchema, WorkloadSchema, type IWorkload, type IWorkloadQuery } from '../schemas/workloadSchema';
import { WorkloadByUsersItemSchema, type IWorkloadByUsersItem } from '../schemas/workloadByUsersSchema';

// ===== МЕТОДЫ РАБОТЫ С НАГРУЗКОЙ (WORKLOAD) =====

/**
 * Получить данные по нагрузке (workload)
 * @param query - параметры фильтрации (from, to, queue и др.)
 * @returns IWorkload
 */
export async function fetchWorkloadData(query?: IWorkloadQuery): Promise<IWorkload> {
  try {
    const safeQuery = WorkloadQuerySchema.partial().parse(query ?? {});
    const data = await fetchWithAuth<unknown>('/aggregations/workload', {
      method: 'GET',
      query: safeQuery,
    });
    // Валидация ответа через zod-схему
    return WorkloadSchema.parse(data);
  } catch (error) {
    throw handleApiError(error, 'Ошибка загрузки данных по нагрузке');
  }
}

/**
 * Получить данные по нагрузке пользователей
 * @param from - дата начала периода в формате DD.MM.YYYY
 * @param to - дата окончания периода в формате DD.MM.YYYY
 * @returns массив IWorkloadByUsersItem
 */
export async function fetchWorkloadByUsers(from: string, to: string): Promise<IWorkloadByUsersItem[]> {
  try {
    const data = await fetchWithAuth<unknown>('/aggregations/workload-users', {
      method: 'GET',
      query: { from, to },
    });
    // Валидация ответа через zod-схему
    const arraySchema = WorkloadByUsersItemSchema.array();
    return arraySchema.parse(data);
  } catch (error) {
    throw handleApiError(error, 'Ошибка загрузки данных по пользователям');
  }
}
