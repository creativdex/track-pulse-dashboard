<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { computed, ref } from "vue";
import type { IWorkloadByUsersItem } from "../schemas/workloadByUsersSchema";
import { useWorkloadByUsersTable } from "../composables/useWorkloadByUsersTable";

const props = defineProps<{
  data: IWorkloadByUsersItem[];
  loading?: boolean;
}>();

// Состояние сортировки
const sortBy = ref<{ column: string; direction: 'asc' | 'desc' }>({
  column: 'hoursSpent',
  direction: 'desc'
});

// Определение колонок таблицы
const columns: TableColumn<IWorkloadByUsersItem>[] = [
  { 
    id: "display", 
    header: "ФИО", 
    accessorKey: "display",
  },
  { 
    id: "hoursSpent", 
    header: "Часов", 
    accessorKey: "hoursSpent",
  },
];

// Реактивные данные
const dataRef = computed(() => props.data);
const { formatHours, totalHours } = useWorkloadByUsersTable(dataRef);

// Сортированные данные
const sortedData = computed(() => {
  if (!props.data.length) return [];
  
  const sorted = [...props.data].sort((a, b) => {
    const aValue = a[sortBy.value.column as keyof IWorkloadByUsersItem];
    const bValue = b[sortBy.value.column as keyof IWorkloadByUsersItem];
    
    if (sortBy.value.column === 'display') {
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortBy.value.direction === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    } else {
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      return sortBy.value.direction === 'asc' 
        ? aNum - bNum
        : bNum - aNum;
    }
  });
  
  return sorted;
});

// Обработчик сортировки
function handleSort({ column, direction }: { column: string; direction: 'asc' | 'desc' }) {
  sortBy.value = { column, direction };
}
</script>

<template>
  <!-- Загрузка -->
  <div v-if="loading" class="flex justify-center py-8">
    <div
      class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
    />
  </div>

  <!-- Таблица -->
  <UCard v-else class="overflow-hidden">
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">Нагрузка по пользователям</h3>
        <div class="text-sm text-gray-500">
          Всего часов: <span class="font-semibold">{{ formatHours(totalHours) }}</span>
        </div>
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable
        :data="sortedData"
        :columns="columns"
        :sort="sortBy"
        :ui="{
          td: 'px-4 py-3',
          th: 'px-4 py-3 bg-gray-50 dark:bg-gray-800',
          tr: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        }"
        @update:sort="handleSort"
      >
        <!-- Колонка ФИО -->
        <template #display-cell="{ row }">
          <div class="flex items-center min-w-0">
            <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-3 flex-shrink-0">
              <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
                {{ row.original.display.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() }}
              </span>
            </div>
            <span class="font-medium text-gray-900 dark:text-white truncate">
              {{ row.original.display }}
            </span>
          </div>
        </template>

        <!-- Колонка часов -->
        <template #hoursSpent-cell="{ row }">
          <div class="text-right">
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ formatHours(row.original.hoursSpent) }}
            </span>
          </div>
        </template>

        <!-- Кастомные заголовки с иконками сортировки -->
        <template #display-header>
          <button 
            class="flex items-center gap-1 font-medium hover:text-gray-700 dark:hover:text-gray-300"
            @click="handleSort({ column: 'display', direction: sortBy.column === 'display' && sortBy.direction === 'asc' ? 'desc' : 'asc' })"
          >
            ФИО
            <UIcon 
              v-if="sortBy.column === 'display'"
              :name="sortBy.direction === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="w-4 h-4"
            />
            <UIcon 
              v-else
              name="i-heroicons-chevron-up-down"
              class="w-4 h-4 opacity-50"
            />
          </button>
        </template>

        <template #hoursSpent-header>
          <button 
            class="flex items-center gap-1 font-medium hover:text-gray-700 dark:hover:text-gray-300 justify-end w-full"
            @click="handleSort({ column: 'hoursSpent', direction: sortBy.column === 'hoursSpent' && sortBy.direction === 'asc' ? 'desc' : 'asc' })"
          >
            Часов
            <UIcon 
              v-if="sortBy.column === 'hoursSpent'"
              :name="sortBy.direction === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="w-4 h-4"
            />
            <UIcon 
              v-else
              name="i-heroicons-chevron-up-down"
              class="w-4 h-4 opacity-50"
            />
          </button>
        </template>
      </UTable>
    </div>
  </UCard>

  <!-- Пустое состояние -->
  <UCard
    v-if="!loading && sortedData.length === 0"
    class="text-center py-12"
  >
    <UIcon
      name="i-heroicons-users"
      class="w-16 h-16 mx-auto mb-4 text-gray-300"
    />
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
      Нет данных для отображения
    </h3>
    <p class="text-gray-500">Выберите период и нажмите "Загрузить данные"</p>
  </UCard>
</template>

<script lang="ts">
export default {
  name: "WorkloadByUsersTable",
};
</script>

<style scoped>
/* Растягиваем таблицу на всю ширину */
:deep(table) {
  width: 100%;
  table-layout: auto;
}

/* Колонка ФИО занимает основное место */
:deep(th:nth-child(1)),
:deep(td:nth-child(1)) {
  width: 70%;
  min-width: 200px;
}

/* Колонка часов фиксированная ширина */
:deep(th:nth-child(2)),
:deep(td:nth-child(2)) {
  width: 30%;
  min-width: 120px;
  text-align: right;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  :deep(th:nth-child(1)),
  :deep(td:nth-child(1)) {
    width: 60%;
    min-width: 150px;
  }
  
  :deep(th:nth-child(2)),
  :deep(td:nth-child(2)) {
    width: 40%;
    min-width: 100px;
  }
}

/* Hover эффекты для заголовков */
:deep(th button:hover) {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

:deep(.dark th button:hover) {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
