import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IWorkloadByUsersItem } from '../schemas/workloadByUsersSchema';
import { fetchWorkloadByUsers } from '../api/client';

export const useWorkloadByUsersStore = defineStore('workloadByUsers', () => {
  // Состояние
  const data = ref<IWorkloadByUsersItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Действия
  async function loadData(from: string, to: string) {
    loading.value = true;
    error.value = null;
    
    try {
      data.value = await fetchWorkloadByUsers(from, to);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Неизвестная ошибка';
      data.value = [];
    } finally {
      loading.value = false;
    }
  }

  function clearData() {
    data.value = [];
    error.value = null;
  }

  return {
    // Состояние
    data,
    loading,
    error,
    
    // Действия
    loadData,
    clearData,
  };
});
