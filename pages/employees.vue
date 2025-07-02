<template>
  <div class="employees-page">
    <EmployeeManagementNew />
  </div>
</template>

<script setup lang="ts">
import EmployeeManagementNew from '~/features/employee-management/ui/EmployeeManagement.vue';
import { useAuthStore } from '~/features/auth/stores/useAuthStore';

// Проверка прав доступа
const authStore = useAuthStore();

// Разрешенные роли для управления сотрудниками
const allowedRoles = ['admin', 'father'];

// Проверяем права доступа
if (!authStore.user || !allowedRoles.includes(authStore.user.role)) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Доступ запрещен. Недостаточно прав для просмотра этой страницы.',
  });
}

// Проверка прав доступа
definePageMeta({
  layout: 'default',
});

// Мета-данные страницы
useSeoMeta({
  title: 'Управление сотрудниками | TrackPulse',
  description: 'Управление окладами и данными сотрудников',
});
</script>


