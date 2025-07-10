<script setup lang="ts">
import { WorkloadView, WorkloadByUsersView } from '~/features/workload';
import { fetchWorkloadData } from '~/features/workload/api/client';
import type { IWorkload } from '~/features/workload/schemas/workloadSchema';
import { ref } from 'vue';

// Состояние вкладок
const activeTab = ref('workload');

// Состояние загрузки и данных для основной нагрузки
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

// Конфигурация вкладок
const tabs = [
  {
    key: 'workload',
    label: 'Детальная нагрузка',
    icon: 'i-heroicons-briefcase',
    description: 'Подробная информация по задачам и проектам'
  },
  {
    key: 'users',
    label: 'Нагрузка по пользователям',
    icon: 'i-heroicons-users',
    description: 'Сводка по рабочему времени сотрудников'
  }
];

// Мета-данные страницы
useSeoMeta({
  title: 'Дашборд | TrackPulse',
  description: 'Аналитика и управление задачами в TrackPulse',
});
</script>

<template>
  <div class="px-6 py-6">
    <!-- Заголовок -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Дашборд
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Аналитика и управление задачами
      </p>
    </div>

    <!-- Переключатель вкладок -->
    <UCard class="mb-6">
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="[
            'flex items-center px-6 py-3 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          ]"
          @click="activeTab = tab.key"
        >
          <UIcon :name="tab.icon" class="mr-2" />
          {{ tab.label }}
        </button>
      </div>
      
      <div>
        <div v-if="activeTab === 'workload'">
          <WorkloadView
            :workload-data="workloadData"
            :loading="isLoading"
            @load-data="handleLoadData"
          />
        </div>

        <div v-else-if="activeTab === 'users'" class="p-6">
          <WorkloadByUsersView />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts">
export default {
  name: "DashboardExtended",
};
</script>
