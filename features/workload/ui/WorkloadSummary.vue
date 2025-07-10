<template>
  <div class="px-4">
    <div class="header mb-6 mt-6">


      <!-- Загрузка -->
      <div v-if="loading" class="space-y-6">
        <!-- Основные метрики -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UCard v-for="n in 4" :key="n" class="text-center">
            <USkeleton class="h-8 w-12 mx-auto mb-2" />
            <USkeleton class="h-4 w-20 mx-auto" />
          </UCard>
        </div>

        <!-- Дополнительные метрики -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard v-for="n in 3" :key="`extra-${n}`" class="text-center">
            <USkeleton class="h-8 w-16 mx-auto mb-2" />
            <USkeleton class="h-4 w-24 mx-auto" />
          </UCard>
        </div>
      </div>

      <!-- Статистика -->
      <div v-else-if="totalProjects > 0 || totalTasks > 0" class="space-y-6">
        <!-- Основные показатели -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UCard class="text-center">
            <div class="text-3xl font-bold text-primary-600">
              {{ totalProjects }}
            </div>
            <div class="text-sm text-gray-500">
              {{ getOnlyWord(totalProjects, "проект", "проекта", "проектов") }}
            </div>
          </UCard>

          <UCard class="text-center">
            <div class="text-3xl font-bold text-blue-600">
              {{ totalTasks }}
            </div>
            <div class="text-sm text-gray-500">
              {{ getOnlyWord(totalTasks, "задача", "задачи", "задач") }}
            </div>
          </UCard>

          <UCard class="text-center">
            <div class="text-3xl font-bold text-green-600">
              {{ totalHours }}
            </div>
            <div class="text-sm text-gray-500">
              {{ getOnlyWord(totalHours, "час", "часа", "часов") }} затрачено
            </div>
          </UCard>

          <UCard class="text-center">
            <div class="text-3xl font-bold text-emerald-600">
              {{ formatCurrency(totalAmount) }}
            </div>
            <div class="text-sm text-gray-500">общая стоимость</div>
          </UCard>
        </div>

        <!-- Ключевые показатели эффективности -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UCard class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {{ formatCurrency(averageProjectCost) }}
            </div>
            <div class="text-sm text-gray-500 mt-1">
              средняя стоимость проекта
            </div>
          </UCard>

          <UCard class="text-center">
            <div class="text-2xl font-bold text-indigo-600">
              {{ averageTaskHours }}h
            </div>
            <div class="text-sm text-gray-500 mt-1">
              среднее время на задачу
            </div>
          </UCard>

          <UCard class="text-center">
            <div class="text-2xl font-bold text-amber-600">
              {{ formatCurrency(hourlyRate) }}
            </div>
            <div class="text-sm text-gray-500 mt-1">средняя стоимость часа</div>
          </UCard>
        </div>
      </div>

      <!-- Пустое состояние -->
      <div v-else class="text-center py-12">
        <UIcon
          name="i-heroicons-chart-bar"
          class="w-16 h-16 mx-auto mb-4 text-gray-300"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Нет данных для отображения
        </h3>
        <p class="text-gray-500">Данные по рабочей нагрузке отсутствуют</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { IWorkload } from "../schemas/workloadSchema";

const props = defineProps<{
  workloadData: IWorkload;
  loading?: boolean;
}>();

// Подсчет общего количества часов
const totalHours = computed(() => {
  const total = props.workloadData.tasks.reduce((total, task) => {
    return total + (task.hoursSpent || 0);
  }, 0);
  // Округляем до 1 знака после запятой
  return Math.round(total * 10) / 10;
});

// Подсчет общей стоимости
const totalAmount = computed(() => {
  return props.workloadData.tasks.reduce((total, task) => {
    return total + (task.amount || 0);
  }, 0);
});

// Подсчет общего количества проектов
const totalProjects = computed(() => {
  return props.workloadData.projects?.length || 0;
});

// Подсчет общего количества задач
const totalTasks = computed(() => {
  return props.workloadData.tasks.length;
});

// Средняя стоимость проекта
const averageProjectCost = computed(() => {
  if (totalProjects.value === 0) return 0;
  return totalAmount.value / totalProjects.value;
});

// Среднее время выполнения задачи
const averageTaskHours = computed(() => {
  const tasksWithHours = props.workloadData.tasks.filter(
    (task) => task.hoursSpent && task.hoursSpent > 0
  );
  if (tasksWithHours.length === 0) return 0;

  const totalTaskHours = tasksWithHours.reduce(
    (sum, task) => sum + (task.hoursSpent || 0),
    0
  );
  return Math.round((totalTaskHours / tasksWithHours.length) * 10) / 10;
});

// Средняя стоимость часа
const hourlyRate = computed(() => {
  if (totalHours.value === 0) return 0;
  return totalAmount.value / totalHours.value;
});

// Функция для форматирования валюты
function formatCurrency(amount: number): string {
  if (!amount || amount === 0) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Функция для склонения русских слов
function getOnlyWord(
  count: number,
  single: string,
  dual: string,
  plural: string
): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return single;
  } else if (
    [2, 3, 4].includes(lastDigit) &&
    ![12, 13, 14].includes(lastTwoDigits)
  ) {
    return dual;
  } else {
    return plural;
  }
}
</script>
