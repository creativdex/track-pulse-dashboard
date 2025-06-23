<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { computed, toRefs, watch } from "vue";
import type { IWorkloadTask, IWorkloadItem } from "../schemas/workloadSchema";
import {
  useWorkloadLookups,
  useWorkloadTable,
  useWorkloadTableStore,
} from "../index";
import type { TableRowItem } from "../composables/useWorkloadTable";

const columnsWorkload: TableColumn<TableRowItem>[] = [
  { id: "expand", header: "", accessorKey: "key" },
  { id: "typeKey", header: "Тип", accessorKey: "typeKey" },
  { id: "summary", header: "Название", accessorKey: "summary" },
  { id: "hoursSpent", header: "Затрачено часов", accessorKey: "hoursSpent" },
  { id: "amount", header: "Стоимость", accessorKey: "amount" },
  { id: "statusKey", header: "Статус", accessorKey: "statusKey" },
  { id: "assigneeId", header: "Ответственный", accessorKey: "assigneeId" },
  { id: "deadline", header: "Дедлайн", accessorKey: "deadline" },
  { id: "resolvedAt", header: "Факт", accessorKey: "resolvedAt" },
  { id: "deltaTime", header: "Δ срок, ч", accessorKey: "deltaTime" },
  { id: "actions", header: "", accessorKey: "key" },
];

const props = defineProps<{
  tasks: IWorkloadTask[];
  projects: IWorkloadItem[];
  statuses: IWorkloadItem[];
  assignees: IWorkloadItem[];
  types: IWorkloadItem[];
  selectedTaskKey?: string;
  loading?: boolean;
}>();

// Инициализируем композаблы и стор
const { statuses, assignees, types, tasks, projects } = toRefs(props);
const lookups = useWorkloadLookups(statuses, assignees, types);
const tableLogic = useWorkloadTable(tasks, projects);
const tableStore = useWorkloadTableStore();

// Извлекаем функции из композаблов
const {
  getStatusDisplay,
  getAssigneeDisplay,
  getTypeDisplay,
  getStatusColor,
  getTypeColor,
} = lookups;
const {
  calculateTotalHours,
  calculateTotalAmount,
  formatHours,
  formatCurrency,
  hasWorklogsInTree,
  hierarchyTasks,
} = tableLogic;

// Инициализируем expand состояние при изменении данных
watch(
  hierarchyTasks,
  (newHierarchy) => {
    // Собираем все элементы, которые должны быть развернуты по умолчанию
    const expandedKeys: string[] = [];
    function collectExpandedItems(items: TableRowItem[]) {
      items.forEach((item) => {
        // Проекты и задачи с детьми разворачиваем по умолчанию
        if (item.children && item.children.length > 0) {
          expandedKeys.push(item.key);
          collectExpandedItems(item.children);
        }
      });
    }
    collectExpandedItems(newHierarchy);
    tableStore.initializeExpanded(expandedKeys);
  },
  { immediate: true }
);

// Функция flatten с учетом состояния стора
function flattenWithStore(items: TableRowItem[]): TableRowItem[] {
  const result: TableRowItem[] = [];

  function addItem(item: TableRowItem) {
    result.push(item);
    // Проверяем состояние развертывания из стора (вызываем функцию)
    const isExpanded = tableStore.isItemExpanded(item.key);
    if (isExpanded && item.children) {
      item.children.forEach(addItem);
    }
  }

  items.forEach(addItem);
  return result;
}

// Плоский список для отображения в таблице
const flattenedTasks = computed(() => {
  // Принудительно обновляем при изменении updateTrigger
  void tableStore.updateTrigger;
  return flattenWithStore(hierarchyTasks.value);
});

// Emits и состояние выбранной строки
const emit = defineEmits<{
  "row-click": [item: IWorkloadTask];
}>();

// Обработчик клика по строке
function handleRowClick(item: TableRowItem) {
  // Переключение выбранной задачи в сторе
  if (tableStore.selectedItemKey === item.key) {
    tableStore.selectTask(null);
  } else {
    tableStore.selectTask(item.key);
  }

  // Для проектов создаем псевдо-задачу для отображения ворклогов всех дочерних
  if ("isProject" in item && item.isProject) {
    const projectAsTask: IWorkloadTask = {
      key: item.key,
      createdAt: item.createdAt,
      deadline: item.deadline,
      resolvedAt: item.resolvedAt,
      deltaTime: item.deltaTime,
      summary: item.summary,
      description: `Все ворклоги проекта: ${item.display}`,
      worklogs: [], // Ворклоги будут собраны в WorklogTimeline
      hoursSpent: null,
      amount: null,
      statusKey: item.statusKey,
      typeKey: item.typeKey,
      assigneeId: item.assigneeId,
      projectId: item.projectId,
      sprintKey: item.sprintKey,
      parentKey: item.parentKey,
    };
    emit("row-click", projectAsTask);
  } else {
    // Для обычных задач эмитируем как есть
    emit("row-click", item as IWorkloadTask);
  }
}

// Функция переключения развертывания
function toggleExpanded(item: TableRowItem) {
  tableStore.toggleExpanded(item.key);
}

// Функция для получения классов строки таблицы
function getRowClass(row: { original: TableRowItem }) {
  const item = row.original;
  return [
    // Выделение выбранной строки
    {
      "bg-primary-50 dark:bg-primary-900/20":
        tableStore.selectedItemKey === item.key,
    },
    // Подсветка строк с ворклогами (у самой задачи или у дочерних)
    {
      "border-l-4 border-primary-300": hasWorklogsInTree(item),
    },
  ];
}
</script>

<template>
  <div class="mx-4">
    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center py-8">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"
      />
    </div>

    <!-- Таблица -->
    <UCard v-else class="overflow-hidden">
      <div class="overflow-x-auto">
        <UTable
          :data="flattenedTasks"
          :columns="columnsWorkload"
          :ui="{
            td: 'px-4 py-3',
            th: 'px-4 py-3 bg-gray-50 dark:bg-gray-800',
            tr: 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer',
          }"
          :row-class="getRowClass"
          @row-click="handleRowClick"
        >
          <!-- Колонка развертывания -->
          <template #expand-cell="{ row }">
            <div
              class="flex justify-center"
              :style="{ marginLeft: `${(row.original.level || 0) * 20}px` }"
            >
              <UButton
                v-if="row.original.children && row.original.children.length > 0"
                variant="ghost"
                size="xs"
                :icon="
                  tableStore.isItemExpanded(row.original.key)
                    ? 'i-heroicons-chevron-down'
                    : 'i-heroicons-chevron-right'
                "
                @click.stop="toggleExpanded(row.original)"
              />
            </div>
          </template>

          <!-- Колонка типа -->
          <template #typeKey-cell="{ row }">
            <UBadge
              v-if="'isProject' in row.original && row.original.isProject"
              color="primary"
              variant="solid"
              size="sm"
            >
              Проект
            </UBadge>
            <UBadge
              v-else
              :color="getTypeColor(row.original.typeKey)"
              variant="soft"
              size="sm"
            >
              {{ getTypeDisplay(row.original.typeKey) }}
            </UBadge>
          </template>

          <!-- Колонка названия -->
          <template #summary-cell="{ row }">
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <!-- Для проектов не показываем ключ -->
                <span
                  v-if="
                    !('isProject' in row.original && row.original.isProject)
                  "
                  class="font-mono text-xs text-gray-500 flex-shrink-0"
                >
                  {{ row.original.key }}
                </span>
                <span
                  :class="{
                    'font-bold text-lg text-gray-900 dark:text-white truncate':
                      'isProject' in row.original && row.original.isProject,
                    'font-medium text-gray-900 dark:text-white truncate': !(
                      'isProject' in row.original && row.original.isProject
                    ),
                  }"
                  :title="row.original.summary"
                >
                  {{ row.original.summary }}
                </span>
              </div>
              <div
                v-if="
                  !('isProject' in row.original && row.original.isProject) &&
                  'description' in row.original &&
                  row.original.description
                "
                class="text-sm text-gray-500 truncate"
                :title="row.original.description"
              >
                {{ row.original.description }}
              </div>
            </div>
          </template>

          <!-- Колонка часов -->
          <template #hoursSpent-cell="{ row }">
            <div class="text-right">
              <span
                :class="{
                  'font-bold':
                    row.original.children && row.original.children.length > 0,
                }"
              >
                {{
                  row.original.children && row.original.children.length > 0
                    ? formatHours(calculateTotalHours(row.original))
                    : formatHours(row.original.hoursSpent)
                }}
              </span>
            </div>
          </template>

          <!-- Колонка суммы -->
          <template #amount-cell="{ row }">
            <div class="text-right">
              <span
                :class="{
                  'font-bold':
                    row.original.children && row.original.children.length > 0,
                }"
              >
                {{
                  row.original.children && row.original.children.length > 0
                    ? formatCurrency(calculateTotalAmount(row.original))
                    : formatCurrency(row.original.amount)
                }}
              </span>
            </div>
          </template>

          <!-- Колонка статуса -->
          <template #statusKey-cell="{ row }">
            <div v-if="'isProject' in row.original && row.original.isProject">
              —
            </div>
            <UBadge
              v-else
              :color="getStatusColor(row.original.statusKey)"
              variant="soft"
              size="sm"
            >
              {{ getStatusDisplay(row.original.statusKey) }}
            </UBadge>
          </template>

          <!-- Колонка ответственного -->
          <template #assigneeId-cell="{ row }">
            <div class="text-sm">
              {{
                "isProject" in row.original && row.original.isProject
                  ? "—"
                  : getAssigneeDisplay(row.original.assigneeId)
              }}
            </div>
          </template>

          <!-- Колонка дедлайна -->
          <template #deadline-cell="{ row }">
            <div class="text-sm">
              {{
                "isProject" in row.original && row.original.isProject
                  ? "—"
                  : row.original.deadline
                  ? row.original.deadline
                  : "—"
              }}
            </div>
          </template>

          <!-- Колонка факта -->
          <template #resolvedAt-cell="{ row }">
            <div class="text-sm">
              {{
                "isProject" in row.original && row.original.isProject
                  ? "—"
                  : row.original.resolvedAt
                  ? row.original.resolvedAt
                  : "—"
              }}
            </div>
          </template>

          <!-- Колонка дельты -->
          <template #deltaTime-cell="{ row }">
            <div
              class="text-sm"
              :class="{
                'text-red-600':
                  typeof row.original.deltaTime === 'number' &&
                  row.original.deltaTime > 0,
                'text-green-600':
                  typeof row.original.deltaTime === 'number' &&
                  row.original.deltaTime < 0,
              }"
            >
              {{
                "isProject" in row.original && row.original.isProject
                  ? "—"
                  : row.original.deltaTime
                  ? row.original.deltaTime
                  : "—"
              }}
            </div>
          </template>

          <!-- Колонка действий -->
          <template #actions-cell="{ row }">
            <div class="flex justify-end space-x-1">
              <UButton
                v-if="hasWorklogsInTree(row.original)"
                :variant="
                  props.selectedTaskKey === row.original.key ? 'solid' : 'ghost'
                "
                :color="
                  props.selectedTaskKey === row.original.key
                    ? 'primary'
                    : 'neutral'
                "
                size="xs"
                icon="i-heroicons-clock"
                @click.stop="handleRowClick(row.original)"
              />
            </div>
          </template>
        </UTable>
      </div>
    </UCard>

    <!-- Пустое состояние -->
    <UCard
      v-if="!loading && flattenedTasks.length === 0"
      class="text-center py-12"
    >
      <UIcon
        name="i-heroicons-briefcase"
        class="w-16 h-16 mx-auto mb-4 text-gray-300"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Нет данных для отображения
      </h3>
      <p class="text-gray-500">Выберите период и нажмите "Загрузить данные"</p>
    </UCard>
  </div>
</template>

<script lang="ts">
export default {
  name: "WorkloadTable",
};
</script>

<style scoped>
/* Ограничиваем ширину столбца названия */
:deep(th:nth-child(3)),
:deep(td:nth-child(3)) {
  max-width: 600px;
  width: 600px;
}

/* Ограничиваем ширину столбца "Затрачено часов" */
:deep(th:nth-child(4)),
:deep(td:nth-child(4)) {
  max-width: 160px;
  width: 160px;
  text-align: right;
}

/* Обеспечиваем горизонтальную прокрутку при широкой таблице */
.overflow-x-auto {
  padding-right: 1rem;
  margin-right: -1rem;
}
</style>
