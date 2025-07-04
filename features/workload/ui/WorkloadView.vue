<script setup lang="ts">
import { watch } from "vue";
import WorkloadTable from "./WorkloadTable.vue";
import WorklogTimeline from "./WorklogTimeline.vue";
import WorkloadSummary from "./WorkloadSummary.vue";
import { useWorkloadPeriod } from '../composables/useWorkloadPeriod';
import { useWorklogSelection } from '../composables/useWorklogSelection';
import WorkloadPeriodPanel from './WorkloadPeriodPanel.vue';
import type { IWorkload } from "../schemas/workloadSchema";

// Принимаем данные workload
const props = defineProps<{
  workloadData: IWorkload;
  loading?: boolean;
}>();
const emit = defineEmits<{
  "load-data": [payload: { from: string | null; to: string | null; queue?: string }];
}>();

// Период и календарь (теперь один экземпляр на весь View)
const period = useWorkloadPeriod();

// Выбор задачи и ворклоги
const { selectedTask, hasWorklogsInTaskTree, handleTaskSelect, clearSelection } = useWorklogSelection();

// Очищаем выбранную задачу при начале загрузки
watch(
  () => props.loading,
  (newLoading) => {
    if (newLoading) {
      clearSelection();
    }
  }
);

// Функция для загрузки данных по периоду
const handleLoadData = (payload: { from: string | null; to: string | null; queue?: string }) => {
  emit("load-data", payload);
};
</script>

<template>
  <div class="px-6">
    <!-- Компонент сводки -->
    <WorkloadSummary :workload-data="workloadData" :loading="loading" />

    <!-- Панель выбора периода -->
    <WorkloadPeriodPanel
      :loading="loading"
      :calendar-range="period.calendarRange"
      :start-simple="period.startSimple"
      :end-simple="period.endSimple"
      :format-date-value="period.formatDateValue"
      :format-date-for-display="period.formatDateForDisplay"
      :pre-seted-data-range="period.preSetedDataRange"
      :e-pre-seted-data-range="period.EPreSetedDataRange"
      @update-calendar="period.handleCalendarUpdate"
      @load-data="handleLoadData"
    />

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
