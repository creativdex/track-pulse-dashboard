<template>
  <div class="employee-management">
    <!-- Заголовок и статистика -->
    <div class="header mb-6">
      <div class="flex justify-between items-center my-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Управление ставками сотрудников
        </h1>
        <UButton
          color="primary"
          variant="outline"
          size="sm"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="handleRefresh"
        >
          Обновить
        </UButton>
      </div>

      <div v-if="!loading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <UCard class="text-center">
          <div class="text-2xl font-bold text-primary-600">
            {{ stats.total }}
          </div>
          <div class="text-sm text-gray-500">Всего сотрудников</div>
        </UCard>
        <UCard class="text-center">
          <div class="text-2xl font-bold text-green-600">
            {{ stats.withSalary }}
          </div>
          <div class="text-sm text-gray-500">Со ставкой</div>
        </UCard>
        <UCard class="text-center">
          <div class="text-2xl font-bold text-red-600">
            {{ stats.withoutSalary }}
          </div>
          <div class="text-sm text-gray-500">Без ставки</div>
        </UCard>
        <UCard class="text-center">
          <div class="text-2xl font-bold text-blue-600">
            {{ formatCurrency(stats.averageSalary) }}
          </div>
          <div class="text-sm text-gray-500">Средняя ставка</div>
        </UCard>
      </div>
    </div>

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
      class="mb-4"
      @close="clearError"
    />

    <!-- Загрузка -->
    <UCard v-if="loading" class="text-center py-8">
      <div class="flex items-center justify-center space-x-2">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        <span class="text-gray-600">Загрузка сотрудников...</span>
      </div>
    </UCard>

    <!-- Таблица сотрудников -->
    <UCard v-else-if="employees.length > 0" class="overflow-hidden">
      <UTable
        :data="employees"
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
    <UCard v-else class="text-center py-12">
      <UIcon
        name="i-heroicons-users"
        class="w-16 h-16 mx-auto mb-4 text-gray-300"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Сотрудники не найдены
      </h3>
      <p class="text-gray-500 mb-4">
        Список сотрудников пуст или произошла ошибка загрузки
      </p>
      <UButton @click="loadEmployees()"> Обновить список </UButton>
    </UCard>

    <!-- Уведомления об изменениях -->
    <UAlert
      v-if="hasUnsavedChanges"
      icon="i-heroicons-exclamation-triangle"
      color="warning"
      variant="soft"
      title="Несохраненные изменения"
      :description="`У вас есть несохраненные изменения: ${changesCount}`"
      class="mt-4"
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          size="xs"
          :disabled="saving"
          @click="handleDiscardAll"
        >
          Отменить все
        </UButton>
        <UButton
          color="warning"
          variant="solid"
          size="xs"
          :loading="saving"
          @click="handleSaveAll"
        >
          Сохранить все ({{ changesCount }})
        </UButton>
      </template>
    </UAlert>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useEmployeeStore } from "../stores/useEmployeeStore";
import type { IEmployeeWithChanges } from "../schemas/employeeSchema";
import { useRuntimeConfig } from '#app';

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
  startEditing,
  cancelEditing,
  updateEmployeeRate,
  applyChange,
  clearError,
  formatCurrency,
} = store;

// ===== HANDLERS =====

const config = useRuntimeConfig();
const hoursPerMonth = config.public.workHoursPerMonth;

// Функция для расчёта ставки из оклада
function calculateRateFromSalary(salary: number): number {
  // 0.87 — НДФЛ, 1.076 — надбавка 7.6%
  return Math.round(((salary / 0.87) * 1.076) / hoursPerMonth);
}

// Следим за изменением newSalaryInput и обновляем newRate/hasChanges
watch(
  employees,
  (list) => {
    list.forEach(emp => {
      if (emp.isEditing) {
        const salary = emp.newSalaryInput || 0;
        const newRate = calculateRateFromSalary(salary);
        emp.newRate = newRate;
        emp.hasChanges = newRate !== emp.rate;
      }
    });
  },
  { deep: true }
);

// При подтверждении оклада
function applySalary(employee: IEmployeeWithChanges & { newSalaryInput?: number }) {
  // newRate и hasChanges уже обновляются watcher'ом
  updateEmployeeRate(employee.id, employee.newRate!);
  applyChange(employee.id);
}

// Переопределяем startEditing, чтобы инициализировать newSalaryInput
const originalStartEditing = startEditing;
function startEditingWithSalaryInput(id: string) {
  originalStartEditing(id);
  const emp = employees.value.find(e => e.id === id);
  if (emp && emp.newSalaryInput === undefined) {
    emp.newSalaryInput = emp.newRate ? Math.round((emp.newRate || 0) * hoursPerMonth) : 0;
  }
}

// Обработчик обновления данных
async function handleRefresh() {
  try {
    await loadEmployees();
    
    const toast = useToast();
    toast.add({
      title: 'Данные обновлены',
      description: 'Информация о сотрудниках успешно обновлена',
      icon: 'i-heroicons-check-circle',
      color: 'success',
    });
  } catch (err) {
    console.error('Ошибка при обновлении данных:', err);
    const toast = useToast();
    toast.add({
      title: 'Ошибка обновления',
      description: 'Не удалось обновить данные сотрудников',
      icon: 'i-heroicons-x-circle',
      color: 'error',
    });
  }
}

// Обработчик сохранения всех изменений
async function handleSaveAll() {
  try {
    await store.saveAllChanges();
    
    const toast = useToast();
    toast.add({
      title: 'Изменения сохранены',
      description: `Успешно обновлено ставок: ${changesCount.value}`,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    });
  } catch (err) {
    console.error('Ошибка при сохранении:', err);
    const toast = useToast();
    toast.add({
      title: 'Ошибка сохранения',
      description: 'Не удалось сохранить изменения',
      icon: 'i-heroicons-x-circle',
      color: 'error',
    });
  }
}

// Обработчик отмены всех изменений
function handleDiscardAll() {
  store.discardAllChanges();
  
  const toast = useToast();
  toast.add({
    title: 'Изменения отменены',
    description: 'Все несохраненные изменения были отменены',
    icon: 'i-heroicons-arrow-uturn-left',
    color: 'info',
  });
}

// ===== TABLE CONFIGURATION =====

// Конфигурация колонок таблицы
const columns: TableColumn<IEmployeeWithChanges>[] = [
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
    header: "Новая ставка",
    accessorKey: "newRate",
  },
  {
    id: "actions",
    header: "Действия",
    accessorKey: "id",
  },
];

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
    await loadEmployees();
    // Инициализация временного поля для оклада
    employees.value.forEach(emp => {
      emp.newSalaryInput = emp.newRate ? Math.round((emp.newRate || 0) * hoursPerMonth) : 0;
    });
  } catch (err) {
    console.error('Ошибка при инициализации:', err);
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
