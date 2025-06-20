<template>
  <UButton
    color="primary"
    variant="ghost"
    size="sm"
    :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
    class="transition-all duration-300"
    aria-label="Переключить тему"
    @click="toggleColorMode"
  />
</template>

<script setup lang="ts">
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === 'dark');

const toggleColorMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark';
};
</script>
