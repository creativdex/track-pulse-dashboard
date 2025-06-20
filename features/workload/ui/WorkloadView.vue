<script setup lang="ts">
import { ref, watch } from "vue";
import type { DateValue } from "@internationalized/date";
import type { IWorkloadTask, IWorkload } from "../schemas/workloadSchema";
import WorkloadTable from "./WorkloadTable.vue";
import WorklogTimeline from "./WorklogTimeline.vue";
import WorkloadSummary from "./WorkloadSummary.vue";

// Принимаем данные workload
const props = defineProps<{
  workloadData: IWorkload;
  loading?: boolean;
}>();

// Определяем emits для передачи событий родительскому компоненту
const emit = defineEmits<{
  "load-data": [payload: { from: string | null; to: string | null }];
}>();

// Состояние дат для выбора периода через календарь
const dataRange = ref({
  start: undefined,
  end: undefined,
});

// Вспомогательная функция для форматирования DateValue в строку YYYY-MM-DD
const formatDateValue = (date: DateValue): string => {
  return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
};

// Вспомогательная функция для форматирования DateValue в строку DD.MM.YYYY
const formatDateForDisplay = (date: DateValue): string => {
  return `${date.day}.${date.month}.${date.year}`;
};

// Функция для загрузки данных по периоду
const handleLoadData = () => {
  if (!dataRange.value?.start || !dataRange.value?.end) {
    emit("load-data", { from: null, to: null });
    return;
  }
  
  const start = dataRange.value.start as DateValue;
  const end = dataRange.value.end as DateValue;
  
  emit("load-data", {
    from: formatDateValue(start),
    to: formatDateValue(end),
  });
};

// Состояние для отслеживания выбранной задачи
const selectedTask = ref<IWorkloadTask | null>(null);

// Проверка наличия ворклогов у задачи или у любой дочерней задачи
function hasWorklogsInTaskTree(
  task: IWorkloadTask,
  allTasks: IWorkloadTask[]
): boolean {
  // Если это псевдо-задача проекта, проверяем ворклоги всех задач проекта
  if (task.description?.includes("Все ворклоги проекта:")) {
    const projectTasks = allTasks.filter((t) => t.projectId === task.key);
    return projectTasks.some((projectTask) =>
      hasWorklogsInTaskTree(projectTask, allTasks)
    );
  }

  // Проверяем саму задачу
  if (task.worklogs && task.worklogs.length > 0) {
    return true;
  }

  // Проверяем дочерние задачи
  const childTasks = allTasks.filter((t) => t.parentKey === task.key);
  return childTasks.some((childTask) =>
    hasWorklogsInTaskTree(childTask, allTasks)
  );
}

// Обработчик события выбора задачи
function handleTaskSelect(task: IWorkloadTask) {
  // Если уже выбрана та же задача, снимаем выделение
  if (selectedTask.value && selectedTask.value.key === task.key) {
    selectedTask.value = null;
  } else {
    // Иначе выбираем новую задачу
    selectedTask.value = task;
  }
}

// Очищаем выбранную задачу при начале загрузки
watch(
  () => props.loading,
  (newLoading) => {
    if (newLoading) {
      selectedTask.value = null;
    }
  }
);
</script>

<template>
  <div class="px-6">
    <!-- Компонент сводки -->
    <WorkloadSummary :workload-data="workloadData" :loading="loading" />

    <!-- Панель выбора периода -->
    <UCard class="mb-6 mx-4">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="flex-1">
          <UPopover>
            <UButton
              variant="outline"
              icon="i-heroicons-calendar-days"
              size="sm"
              trailing-icon="i-heroicons-chevron-down"
            >
              {{
                dataRange?.start && dataRange?.end
                  ? `${formatDateForDisplay(dataRange.start as DateValue)} — ${formatDateForDisplay(dataRange.end as DateValue)}`
                  : "Выберите период"
              }}
            </UButton>

            <template #content>
              <UCalendar
                v-model="dataRange"
                range
              />
            </template>
          </UPopover>
        </div>

        <div>
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-arrow-path"
            :loading="loading"
            :disabled="!dataRange?.start || !dataRange?.end"
            @click="handleLoadData"
          >
            Загрузить данные
          </UButton>
        </div>
      </div>
    </UCard>

    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Контейнер с таблицей (занимает все доступное место или ограничено если открыт ворклог) -->
      <div
        :class="{
          'w-full': !(
            selectedTask &&
            hasWorklogsInTaskTree(selectedTask, workloadData.tasks)
          ),
          'w-full lg:w-3/5':
            selectedTask &&
            hasWorklogsInTaskTree(selectedTask, workloadData.tasks),
        }"
      >
        <!-- Добавляем события для выбора задачи -->
        <WorkloadTable
          :tasks="workloadData.tasks"
          :projects="workloadData.projects"
          :statuses="workloadData.statuses"
          :assignees="workloadData.assignees"
          :types="workloadData.types"
          :selected-task-key="selectedTask?.key"
          :loading="loading"
          @row-click="handleTaskSelect"
        />
      </div>

      <!-- Компонент с таймлайном ворклогов (показывается только при выбранной задаче с ворклогами) -->
      <div
        v-if="
          selectedTask &&
          hasWorklogsInTaskTree(selectedTask, workloadData.tasks)
        "
        class="w-full lg:w-2/5"
      >
        <div class="mx-4">
          <WorklogTimeline
            :task="selectedTask"
            :all-tasks="workloadData.tasks"
            :assignees="workloadData.assignees"
            :title="`${selectedTask.key} - ${selectedTask.summary}`"
          />
        </div>
      </div>
      <!-- Сообщение, если выбрана задача без ворклогов -->
      <div v-else-if="selectedTask" class="w-full lg:w-2/5">
        <div
          class="mx-4 border border-neutral-600 rounded-lg p-4 bg-white dark:bg-neutral-800 shadow-sm"
        >
          <div class="text-center py-8 text-gray-500">
            У задачи «{{ selectedTask.key }} - {{ selectedTask.summary }}» и её
            дочерних задач нет записей о выполненной работе
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
