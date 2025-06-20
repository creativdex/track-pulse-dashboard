<template>
  <div class="employees-page">
    <EmployeeManagementNew />
  </div>
</template>

<script setup lang="ts">
import EmployeeManagementNew from '~/features/employee-management/ui/EmployeeManagement.vue';

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


