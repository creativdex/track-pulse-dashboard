<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Статистика активности</h3>
        <UIcon name="i-heroicons-chart-bar-square" class="w-5 h-5 text-gray-400" />
      </div>
    </template>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard class="p-4">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 mb-2">
            {{ stats.daysActive }}
          </div>
          <div class="text-sm text-gray-500">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 inline mr-1" />
            Дней активности
          </div>
        </div>
      </UCard>

      <UCard class="p-4">
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600 mb-2">
            {{ stats.lastLogin }}
          </div>
          <div class="text-sm text-gray-500">
            <UIcon name="i-heroicons-clock" class="w-4 h-4 inline mr-1" />
            Дней назад
          </div>
        </div>
      </UCard>

      <UCard class="p-4">
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600 mb-2">
            {{ stats.accountAge }}
          </div>
          <div class="text-sm text-gray-500">
            <UIcon name="i-heroicons-user-plus" class="w-4 h-4 inline mr-1" />
            Дней в системе
          </div>
        </div>
      </UCard>

      <UCard class="p-4">
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600 mb-2">
            {{ user?.isActive ? '✓' : '✗' }}
          </div>
          <div class="text-sm text-gray-500">
            <UIcon name="i-heroicons-shield-check" class="w-4 h-4 inline mr-1" />
            Статус
          </div>
        </div>
      </UCard>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  user: {
    id: string;
    login: string;
    role: string;
    isActive: boolean;
    firstName?: string;
    lastName?: string;
    lastLoginAt?: Date | string | null;
  } | null;
  stats: {
    daysActive: number;
    lastLogin: number;
    accountAge: number;
  };
}

defineProps<Props>();
</script>
