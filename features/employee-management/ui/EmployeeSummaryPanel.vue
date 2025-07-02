<template>
  <UCard class="mb-6 mx-4">
    <div class="flex flex-col sm:flex-row gap-4 items-end">
      <!-- Статистика -->
      <div class="flex-1">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-primary-600">
              {{ stats.total }}
            </div>
            <div class="text-sm text-gray-500">Всего сотрудников</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ stats.withSalary }}
            </div>
            <div class="text-sm text-gray-500">Со ставкой</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">
              {{ stats.withoutSalary }}
            </div>
            <div class="text-sm text-gray-500">Без ставки</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ formatCurrency(stats.averageSalary) }}
            </div>
            <div class="text-sm text-gray-500">Средняя ставка</div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Stats {
  total: number;
  withSalary: number;
  withoutSalary: number;
  averageSalary: number;
}

defineProps<{
  stats: Stats;
  formatCurrency: (amount: number) => string;
}>();
</script>
