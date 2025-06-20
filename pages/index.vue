<template>
  <div class="flex justify-center items-center h-screen">
    <ULoading color="primary" size="lg" />
  </div>
</template>

<script setup lang="ts">
// Явно указываем макет для страницы
import { onMounted } from 'vue';
import { useAuthStore } from '~/features/auth/stores/useAuthStore';

definePageMeta({
  layout: 'default'
});

const authStore = useAuthStore();

// При открытии корневой страницы сразу перенаправляем
onMounted(async () => {
  try {
    // Пытаемся инициализировать авторизацию
    await authStore.init();
    
    // Перенаправляем на соответствующую страницу
    if (authStore.isAuthenticated) {
      navigateTo('/dashboard');
    } else {
      navigateTo('/auth');
    }
  } catch (error) {
    console.error('Ошибка при инициализации:', error);
    navigateTo('/auth');
  }
});
</script>

<style scoped>
</style>