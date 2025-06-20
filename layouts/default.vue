<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <!-- Заголовок с меню -->
    <AppHeader />
    
    <!-- Основной контент -->
    <main class="flex-grow">
      <slot />
    </main>
    
    <!-- Подвал (опционально) -->
    <footer class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      <div class="container mx-auto">
        &copy; {{ new Date().getFullYear() }} TrackPulse
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Здесь можно добавить общую логику для layout
</script>