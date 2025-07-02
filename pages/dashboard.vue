<script setup lang="ts">
import { WorkloadView } from '~/features/workload';
import { fetchWorkloadData } from '~/features/workload/api/client';
import type { IWorkload } from '~/features/workload/schemas/workloadSchema';
import { ref } from 'vue';

// Состояние загрузки и данных
const isLoading = ref(false);
const workloadData = ref<IWorkload>({
  projects: [],
  sprints: [],
  types: [],
  statuses: [],
  assignees: [],
  tasks: []
});

// Функция загрузки данных за выбранный период
const handleLoadData = async (dateRange: { from: string | null; to: string | null; queue?: string }) => {
  console.log('Загрузка данных за период:', dateRange);
  
  isLoading.value = true;
  
  try {
    // Вызываем реальный API
    const data = await fetchWorkloadData({
      from: dateRange.from || undefined,
      to: dateRange.to || undefined,
      queue: dateRange.queue || undefined,
    });
    
    workloadData.value = data;
    
    console.log('✅ Данные за период загружены');
    
    // Показываем уведомление об успехе
    const toast = useToast();
    toast.add({
      title: 'Данные загружены',
      description: `Период: ${dateRange.from || 'не указано'} - ${dateRange.to || 'не указано'}${dateRange.queue ? `, очередь: ${dateRange.queue}` : ''}`,
      icon: 'i-heroicons-check-circle',
      color: 'success'
    });
    
  } catch (error) {
    console.error('❌ Ошибка при загрузке данных за период:', error);
    
    // Показываем уведомление об ошибке
    const toast = useToast();
    toast.add({
      title: 'Ошибка загрузки',
      description: 'Не удалось загрузить данные за выбранный период',
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <WorkloadView
    :workload-data="workloadData"
    :loading="isLoading"
    @load-data="handleLoadData"
  />
</template>
