import { computed } from 'vue';
import type { Ref } from 'vue';
import type { IWorkloadByUsersItem } from '../schemas/workloadByUsersSchema';

export function useWorkloadByUsersTable(data: Ref<IWorkloadByUsersItem[]>) {
  
  /**
   * Форматирование часов в формате HH:MM
   */
  function formatHours(hours: number | null): string {
    if (hours === null || hours === undefined) {
      return '—';
    }
    
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * Вычисление общего количества часов
   */
  const totalHours = computed(() => {
    return data.value.reduce((sum, item) => sum + item.hoursSpent, 0);
  });

  return {
    formatHours,
    totalHours,
  };
}
