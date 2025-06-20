import { fetchWithAuth, handleApiError } from '../../../shared/api/utils';
import { WorkloadQuerySchema, WorkloadSchema, type IWorkload, type IWorkloadQuery } from '../schemas/workloadSchema';

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
