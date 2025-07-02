<script setup lang="ts">
import { UserManagement, useAuthStore } from '~/features/auth';
import { EUserRole } from '~/features/auth/enum/roleUserEnum';

// Проверка авторизации и роли администратора
const authStore = useAuthStore();

// Мета информация страницы
definePageMeta({
  layout: 'default'
});

// Проверяем, является ли пользователь администратором
const isAdmin = computed(() => {
  return authStore.user?.role === EUserRole.ADMIN || authStore.user?.role === EUserRole.FATHER;
});

// Если не админ, перенаправляем на главную
if (!isAdmin.value) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Доступ запрещен. Требуются права администратора.'
  });
}
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <UserManagement />
  </div>
</template>
