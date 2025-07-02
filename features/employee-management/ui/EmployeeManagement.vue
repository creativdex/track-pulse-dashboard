<template>
  <div class="employee-management">
    <!-- Заголовок -->
    <div class="mx-4 mb-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        Управление ставками сотрудников
      </h1>
    </div>

    <!-- Панель сводки -->
    <EmployeeSummaryPanel :stats="stats" :format-currency="formatCurrency" />

    <!-- Панель управления -->
    <EmployeeControlPanel
      :has-unsaved-changes="hasUnsavedChanges"
      :changes-count="changesCount"
      :loading="loading"
      :saving="saving"
      :search-query="searchQuery"
      @refresh="handleRefresh"
      @refresh-with-type="handleRefreshWithType"
      @save-all="handleSaveAll"
      @save-all-with-type="handleSaveAllWithType"
      @discard-all="handleDiscardAll"
      @search="handleSearch"
      @rate-type-changed="handleRateTypeChanged"
    />

    <!-- Сообщение об ошибке -->
    <UAlert
      v-if="error"
      icon="i-heroicons-x-circle"
      color="error"
      variant="soft"
      :title="error"
      :close-button="{
        icon: 'i-heroicons-x-mark-20-solid',
        color: 'error',
        variant: 'link',
      }"
      class="mb-4 mx-4"
      @close="clearError"
    />

    <!-- Загрузка -->
    <UCard v-if="loading" class="text-center py-8 mx-4">
      <div class="flex items-center justify-center space-x-2">
        <div
          class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"
        />
        <span class="text-gray-600">Загрузка сотрудников...</span>
      </div>
    </UCard>

    <!-- Таблица сотрудников -->
    <UCard
      v-else-if="filteredEmployees.length > 0"
      class="overflow-hidden mx-4"
    >
      <!-- Счетчик результатов -->
      <div
        v-if="searchQuery"
        class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Найдено {{ filteredEmployees.length }} из
          {{ employees.length }} сотрудников
          <UButton
            v-if="searchQuery"
            color="neutral"
            variant="link"
            size="xs"
            class="ml-2"
            @click="clearFilters"
          >
            Сбросить поиск
          </UButton>
        </p>
      </div>

      <UTable
        :data="filteredEmployees"
        :columns="columns"
        :ui="{
          td: 'px-4 py-3',
          th: 'px-4 py-3 bg-gray-50 dark:bg-gray-800',
          tr: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        }"
        :row-class="getRowClass"
      >
        <!-- Колонка с информацией о сотруднике -->
        <template #employee-cell="{ row }">
          <div class="flex items-center space-x-3">
            <UAvatar :text="getEmployeeInitials(row.original)" size="sm" />
            <div class="min-w-0 flex-1">
              <div class="font-medium text-gray-900 dark:text-white truncate">
                {{ row.original.display }}
              </div>
              <div class="text-sm text-gray-500 truncate">
                @{{ row.original.login }}
              </div>
            </div>
          </div>
        </template>

        <!-- Колонка с Email -->
        <template #email-cell="{ row }">
          <div class="text-sm text-gray-900 dark:text-white">
            {{ row.original.email }}
          </div>
        </template>

        <!-- Колонка с текущей ставкой -->
        <template #currentSalary-cell="{ row }">
          <div class="text-right">
            <UBadge
              v-if="row.original.rate === null"
              color="error"
              variant="soft"
              size="sm"
            >
              Не установлена
            </UBadge>
            <span v-else class="font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(row.original.rate) }}/час
            </span>
          </div>
        </template>

        <!-- Колонка с новой ставкой -->
        <template #newSalary-cell="{ row }">
          <div class="min-w-0 flex-1">
            <div
              v-if="row.original.isEditing"
              class="flex items-center space-x-2"
            >
              <!-- Ввод оклада для глобальных ставок -->
              <template v-if="currentRateType === 'global'">
                <UInput
                  v-model.number="row.original.newSalaryInput"
                  type="number"
                  :min="0"
                  :step="1000"
                  placeholder="Введите оклад"
                  size="sm"
                  :class="row.original.hasChanges ? 'ring-2 ring-orange-500' : ''"
                  @keyup.enter="applySalary(row.original)"
                  @keyup.escape="cancelEditing(row.original.id)"
                />
                <span class="text-sm text-gray-500 whitespace-nowrap">₽/мес</span>
              </template>
              
              <!-- Прямой ввод ставки для проектных/очередных ставок -->
              <template v-else>
                <UInput
                  v-model.number="row.original.newDirectRate"
                  type="number"
                  :min="0"
                  :step="50"
                  placeholder="Введите ставку"
                  size="sm"
                  :class="row.original.hasChanges ? 'ring-2 ring-orange-500' : ''"
                  @keyup.enter="applyChange(row.original.id)"
                  @keyup.escape="cancelEditing(row.original.id)"
                />
                <span class="text-sm text-gray-500 whitespace-nowrap">₽/час</span>
              </template>
            </div>
            <div
              v-else-if="row.original.hasChanges"
              class="flex items-center space-x-2"
            >
              <UBadge color="warning" variant="soft" class="font-medium">
                {{ formatCurrency(row.original.newRate || 0) }}/час
              </UBadge>
              <UIcon
                name="i-heroicons-pencil-square"
                class="w-4 h-4 text-orange-500"
              />
            </div>
            <div v-else class="text-center text-gray-400">—</div>
          </div>
        </template>

        <!-- Колонка с действиями -->
        <template #actions-cell="{ row }">
          <div class="flex justify-center space-x-1">
            <template v-if="row.original.isEditing">
              <UButton
                :disabled="!row.original.hasChanges"
                color="success"
                variant="soft"
                size="xs"
                icon="i-heroicons-check"
                @click="applyChange(row.original.id)"
              />
              <UButton
                color="neutral"
                variant="soft"
                size="xs"
                icon="i-heroicons-x-mark"
                @click="cancelEditing(row.original.id)"
              />
            </template>
            <template v-else>
              <UButton
                :disabled="saving"
                color="primary"
                variant="soft"
                size="xs"
                :icon="
                  row.original.rate === null
                    ? 'i-heroicons-plus'
                    : 'i-heroicons-pencil-square'
                "
                @click="startEditingWithSalaryInput(row.original.id)"
              />
            </template>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Пустое состояние -->
    <UCard v-else class="text-center py-12 mx-4">
      <UIcon
        name="i-heroicons-users"
        class="w-16 h-16 mx-auto mb-4 text-gray-300"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {{
          employees.length === 0
            ? "Сотрудники не найдены"
            : "Нет результатов поиска"
        }}
      </h3>
      <p class="text-gray-500 mb-4">
        {{
          employees.length === 0
            ? "Список сотрудников пуст или произошла ошибка загрузки"
            : "По заданным критериям поиска и фильтрации ничего не найдено"
        }}
      </p>
      <div class="flex gap-2 justify-center">
        <UButton v-if="employees.length === 0" @click="loadEmployees()">
          Обновить список
        </UButton>
        <UButton v-else color="neutral" variant="outline" @click="clearFilters">
          Сбросить фильтры
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { onMounted, watch, ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useEmployeeStore } from "../stores/useEmployeeStore";
import type { IEmployeeWithChanges } from "../schemas/employeeSchema";
import { EUserTrackerRateType } from "../schemas/employeeSchema";
import { useRuntimeConfig } from "#app";
import EmployeeSummaryPanel from "./EmployeeSummaryPanel.vue";
import EmployeeControlPanel from "./EmployeeControlPanel.vue";

// ===== STORE SETUP =====
const store = useEmployeeStore();

const {
  employees,
  loading,
  saving,
  error,
  stats,
  hasUnsavedChanges,
  changesCount,
} = storeToRefs(store);

const {
  loadEmployees,
  loadEmployeesByRateType,
  startEditing,
  cancelEditing,
  applyChange,
  clearError,
  formatCurrency,
} = store;

// ===== STATE FOR FILTERING =====

// Состояние для поиска
const searchQuery = ref("");

// Текущий тип ставки
const currentRateType = ref<EUserTrackerRateType>(EUserTrackerRateType.GLOBAL);

// Функция для обработки изменения типа ставки
function handleRateTypeChanged(rateType: EUserTrackerRateType) {
  currentRateType.value = rateType;
}

// Отфильтрованный список сотрудников
const filteredEmployees = computed(() => {
  let result = employees.value;

  // Применяем поиск
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter(
      (emp) =>
        emp.display.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.login.toLowerCase().includes(query)
    );
  }

  return result;
});

// ===== HANDLERS =====

const config = useRuntimeConfig();
const hoursPerMonth = config.public.workHoursPerMonth;

// Функция для расчёта ставки из оклада (только для глобальных ставок)
function calculateRateFromSalary(salary: number): number {
  if (currentRateType.value === EUserTrackerRateType.GLOBAL) {
    // Сложная формула для глобальных ставок: 0.87 — НДФЛ, 1.076 — надбавка 7.6%
    return Math.round(((salary / 0.87) * 1.076) / hoursPerMonth);
  } else {
    // Простая формула для проектных/очередных ставок: прямое деление
    return Math.round(salary / hoursPerMonth);
  }
}

// Следим за изменениями newSalaryInput и newDirectRate и обновляем newRate/hasChanges
watch(
  employees,
  (list) => {
    list.forEach((emp) => {
      if (emp.isEditing) {
        let newRate: number;
        
        if (currentRateType.value === EUserTrackerRateType.GLOBAL) {
          // Для глобальных ставок: расчет по окладу
          const salary = emp.newSalaryInput || 0;
          newRate = calculateRateFromSalary(salary);
        } else {
          // Для проектных/очередных ставок: прямой ввод
          newRate = emp.newDirectRate || 0;
        }
        
        // Обновляем значения
        emp.newRate = newRate;
        emp.hasChanges = newRate !== emp.rate;
      }
    });
  },
  { deep: true }
);

// При подтверждении оклада
function applySalary(
  employee: IEmployeeWithChanges & { newSalaryInput?: number }
) {
  // newRate и hasChanges уже обновляются watcher'ом
  applyChange(employee.id);
}

// Переопределяем startEditing, чтобы инициализировать поля ввода
const originalStartEditing = startEditing;
function startEditingWithSalaryInput(id: string) {
  originalStartEditing(id);
  const emp = employees.value.find((e) => e.id === id);
  if (emp) {
    if (currentRateType.value === EUserTrackerRateType.GLOBAL) {
      // Для глобальных ставок: инициализируем оклад
      if (emp.newSalaryInput === undefined) {
        emp.newSalaryInput = emp.newRate
          ? Math.round((emp.newRate || 0) * hoursPerMonth)
          : 0;
      }
    } else {
      // Для проектных/очередных ставок: инициализируем прямую ставку
      if (emp.newDirectRate === undefined) {
        emp.newDirectRate = emp.newRate || 0;
      }
    }
  }
}

// Обработчик обновления данных
async function handleRefresh() {
  try {
    await loadEmployees();

    const toast = useToast();
    toast.add({
      title: "Данные обновлены",
      description: "Информация о сотрудниках успешно обновлена",
      icon: "i-heroicons-check-circle",
      color: "success",
    });
  } catch {
    const toast = useToast();
    toast.add({
      title: "Ошибка обновления",
      description: "Не удалось обновить данные сотрудников",
      icon: "i-heroicons-x-circle",
      color: "error",
    });
  }
}

// Обработчик обновления данных с учетом типа ставки
async function handleRefreshWithType(params: { rateType: import('../schemas/employeeSchema').EUserTrackerRateType; contextValue?: string }) {
  try {
    await loadEmployeesByRateType(params.rateType, params.contextValue);

    const toast = useToast();
    toast.add({
      title: "Данные обновлены",
      description: "Информация о сотрудниках успешно обновлена",
      icon: "i-heroicons-check-circle",
      color: "success",
    });
  } catch {
    const toast = useToast();
    toast.add({
      title: "Ошибка обновления",
      description: "Не удалось обновить данные сотрудников",
      icon: "i-heroicons-x-circle",
      color: "error",
    });
  }
}

// Обработчик сохранения всех изменений
async function handleSaveAll() {
  try {
    const result = await store.saveAllChanges();

    const toast = useToast();
    toast.add({
      title: "Изменения сохранены",
      description: `Успешно обновлено ставок: ${result?.updated || 0}`,
      icon: "i-heroicons-check-circle",
      color: "success",
    });
  } catch {
    const toast = useToast();
    toast.add({
      title: "Ошибка сохранения",
      description: "Не удалось сохранить изменения",
      icon: "i-heroicons-x-circle",
      color: "error",
    });
  }
}

// Обработчик сохранения всех изменений с типом ставки
async function handleSaveAllWithType(params: {
  rateType: import("../schemas/employeeSchema").EUserTrackerRateType;
  contextValue?: string;
}) {
  try {
    const result = await store.saveAllChanges(
      params.rateType,
      params.contextValue
    );

    const toast = useToast();
    toast.add({
      title: "Изменения сохранены",
      description: `Успешно обновлено ставок: ${result?.updated || 0}`,
      icon: "i-heroicons-check-circle",
      color: "success",
    });
  } catch {
    const toast = useToast();
    toast.add({
      title: "Ошибка сохранения",
      description: "Не удалось сохранить изменения",
      icon: "i-heroicons-x-circle",
      color: "error",
    });
  }
}

// Обработчик отмены всех изменений
function handleDiscardAll() {
  store.discardAllChanges();

  const toast = useToast();
  toast.add({
    title: "Изменения отменены",
    description: "Все несохраненные изменения были отменены",
    icon: "i-heroicons-arrow-uturn-left",
    color: "info",
  });
}

// Обработчики для поиска и фильтрации
function handleSearch(query: string) {
  searchQuery.value = query;
}

// Сброс поиска
function clearFilters() {
  searchQuery.value = "";
}

// ===== TABLE CONFIGURATION =====

// Конфигурация колонок таблицы
const columns = computed<TableColumn<IEmployeeWithChanges>[]>(() => [
  {
    id: "employee",
    header: "Сотрудник",
    accessorKey: "display",
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
  },
  {
    id: "currentSalary",
    header: "Текущая ставка",
    accessorKey: "rate",
  },
  {
    id: "newSalary",
    header: currentRateType.value === EUserTrackerRateType.GLOBAL ? "Новый оклад" : "Новая ставка",
    accessorKey: "newRate",
  },
  {
    id: "actions",
    header: "Действия",
    accessorKey: "id",
  },
]);

// ===== UTILITY FUNCTIONS =====

// Получение инициалов сотрудника
function getEmployeeInitials(employee: IEmployeeWithChanges): string {
  const names = employee.display.split(" ");
  if (names.length >= 2) {
    return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
  }
  return employee.display.charAt(0).toUpperCase();
}

// Получение класса для строки таблицы
function getRowClass(row: { original: IEmployeeWithChanges }) {
  const employee = row.original;
  return [
    {
      "bg-orange-50 dark:bg-orange-900/20": employee.hasChanges,
      "bg-blue-50 dark:bg-blue-900/20": employee.isEditing,
    },
  ];
}

// ===== LIFECYCLE =====

onMounted(async () => {
  try {
    // Загружаем сотрудников с глобальными ставками по умолчанию
    await loadEmployeesByRateType(EUserTrackerRateType.GLOBAL);
    // Инициализация временных полей для ввода
    employees.value.forEach((emp) => {
      // Для глобальных ставок: инициализируем оклад
      emp.newSalaryInput = emp.newRate
        ? Math.round((emp.newRate || 0) * hoursPerMonth)
        : 0;
      // Для проектных/очередных ставок: инициализируем прямую ставку  
      emp.newDirectRate = emp.newRate || 0;
    });
  } catch {
    // Игнорируем ошибки при инициализации
  }
});
</script>

<style scoped>
.employee-management {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .employee-management {
    padding: 16px;
  }
}
</style>
