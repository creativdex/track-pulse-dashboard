<script setup lang="ts">
import { UserManagement, useAuthStore } from '~/features/auth';

// Проверка авторизации и роли администратора
const authStore = useAuthStore();

// Мета информация страницы
definePageMeta({
  layout: 'default'
});

// Проверяем, является ли пользователь администратором
const isAdmin = computed(() => {
  return authStore.user?.role === 'admin';
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
