<script setup lang="ts">
import { WorkloadByUsersView } from '~/features/workload';

// Мета данные страницы
definePageMeta({
  title: 'Нагрузка по пользователям',
  description: 'Просмотр рабочей нагрузки сотрудников за выбранный период',
});

// SEO
useSeoMeta({
  title: 'Нагрузка по пользователям - TrackPulse',
  description: 'Просмотр рабочей нагрузки сотрудников за выбранный период',
});
</script>

<template>
  <div>
    <!-- Заголовок страницы -->
    <div class="px-6 mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Нагрузка по пользователям
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Просмотр рабочей нагрузки сотрудников за выбранный период
      </p>
    </div>

    <!-- Компонент -->
    <WorkloadByUsersView />
  </div>
</template>

<script lang="ts">
export default {
  name: "WorkloadByUsersPage",
};
</script>
