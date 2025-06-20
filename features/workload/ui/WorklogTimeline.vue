<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import type {
  IWorkloadTask,
  IWorklogItem,
  IWorkloadItem,
} from "../schemas/workloadSchema";
import { UiTimeline } from "~/shared/ui";
import type { TimelineItem } from "~/shared/ui/UiTimeline.vue";

// Принимаем необходимые свойства: задачу с ворклогами и список всех задач для поиска дочерних
const props = defineProps<{
  task?: IWorkloadTask;
  allTasks?: IWorkloadTask[];
  assignees?: IWorkloadItem[];
  title?: string;
}>();

// Реактивный список ворклогов текущей задачи и всех дочерних
const worklogs = ref<IWorklogItem[]>([]);

// Получение всех ворклогов задачи и её дочерних, или всех задач проекта
function getAllWorklogs(task: IWorkloadTask, allTasks: IWorkloadTask[]): IWorklogItem[] {
  const taskWorklogs = task.worklogs || [];
  
  // Если это псевдо-задача проекта (определяем по описанию)
  if (task.description && task.description.includes('Все ворклоги проекта:')) {
    // Получаем все задачи проекта
    const allProjectTasks = allTasks.filter(t => t.projectId === task.key);
    
    // Находим только корневые задачи проекта (те, у которых parentKey не принадлежит этому проекту)
    const projectTaskKeys = new Set(allProjectTasks.map(t => t.key));
    const rootProjectTasks = allProjectTasks.filter(t => 
      !t.parentKey || !projectTaskKeys.has(t.parentKey)
    );
    
    // Собираем ворклоги только с корневых задач (они сами соберут дочерние)
    const projectWorklogs: IWorklogItem[] = [];
    rootProjectTasks.forEach(rootTask => {
      const rootTaskWorklogs = getAllWorklogs(rootTask, allTasks);
      projectWorklogs.push(...rootTaskWorklogs);
    });
    
    return projectWorklogs;
  }
  
  // Обычная логика для задач - находим дочерние задачи
  const childTasks = allTasks.filter(t => t.parentKey === task.key);
  
  // Рекурсивно собираем ворклоги дочерних задач
  const childWorklogs: IWorklogItem[] = [];
  childTasks.forEach(childTask => {
    const childTaskWorklogs = getAllWorklogs(childTask, allTasks);
    childWorklogs.push(...childTaskWorklogs);
  });
  
  return [...taskWorklogs, ...childWorklogs];
}

// Отслеживаем изменение выбранной задачи и обновляем список ворклогов
watchEffect(() => {
  if (props.task && props.allTasks) {
    const allWorklogs = getAllWorklogs(props.task, props.allTasks);
    
    // Сортируем ворклоги по дате создания (от новых к старым)
    worklogs.value = allWorklogs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (props.task && props.task.worklogs) {
    // Если нет списка всех задач, показываем только ворклоги текущей задачи
    worklogs.value = [...props.task.worklogs].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else {
    worklogs.value = [];
  }
});

// Вычисляем общее количество затраченных часов
const totalHoursSpent = computed(() => {
  return worklogs.value.reduce(
    (total: number, worklog: IWorklogItem) => total + (worklog.hoursSpent || 0),
    0
  );
});

// Получение имени пользователя по ID
function getAssigneeName(assigneeId: string | null): string {
  if (!assigneeId || !props.assignees) return assigneeId || "Неизвестно";
  const assignee = props.assignees.find(a => a.key === assigneeId);
  return assignee?.display || assigneeId;
}

// Преобразуем ворклоги в формат для UiTimeline
const timelineItems = computed<TimelineItem[]>(() => {
  return worklogs.value.map((worklog: IWorklogItem) => {
    const dateObj = new Date(worklog.createdAt);

    return {
      id: worklog.key,
      date: dateObj.toLocaleDateString("ru-RU"),
      title: getAssigneeName(worklog.authorId), // Расшифровываем ID в имя
      description: worklog.comment || "Без комментария",
      icon: "i-lucide-clock",
      value: worklog.key,
      // Добавляем все дополнительные поля для использования в шаблонах
      hoursSpent: worklog.hoursSpent || 0,
      amount: worklog.amount,
      issueKey: worklog.issueKey,
      createdAt: worklog.createdAt,
      // Дополнительная информация из ворклога
      originalWorklog: worklog,
    };
  });
});

// Форматируем часы с правильным склонением
function formatHours(hours: number): string {
  // Округляем до 1 знака после запятой
  const roundedHours = Math.round(hours * 10) / 10;
  
  const lastDigit = Math.floor(roundedHours) % 10;
  const lastTwoDigits = Math.floor(roundedHours) % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${roundedHours} час`;
  } else if (
    [2, 3, 4].includes(lastDigit) &&
    ![12, 13, 14].includes(lastTwoDigits)
  ) {
    return `${roundedHours} часа`;
  } else {
    return `${roundedHours} часов`;
  }
}

// Форматируем дату и время
function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <UCard
    class="worklog-timeline px-5 py-2"
    :ui="{
      root: 'border border-gray-200 dark:border-gray-800',
      header: 'border-b border-neutral-300 dark:border-neutral-700',
    }"
  >
    <template #header>
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">
          {{
            title ||
            (task ? `${task.key} - ${task.summary}` : "Затраченное время")
          }}
        </h3>
        <UBadge v-if="totalHoursSpent > 0" color="primary" variant="subtle">
          Всего: {{ formatHours(totalHoursSpent) }}
        </UBadge>
      </div>
    </template>

    <template #default>
      <div v-if="worklogs.length === 0" class="text-center py-8 text-gray-400">
        Нет записей о выполненной работе
      </div>

      <div v-else class="worklog-content">
        <!-- Используем UiTimeline для отображения ворклогов -->
        <UiTimeline
          :items="timelineItems"
          size="sm"
          color="primary"
          orientation="vertical"
          class="worklog-timeline-items"
        >
          <!-- Кастомизация даты -->
          <template #date="{ item: slotItem }">
            <div class="flex items-center justify-between">
              <span>{{ slotItem.date }}</span>
              <span class="text-xs ml-2 text-gray-500 dark:text-gray-400">{{
                formatDateTime(String(slotItem.createdAt))
              }}</span>
            </div>
          </template>

          <!-- Кастомизация заголовка -->
          <template #title="{ item: slotItem }">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-user-circle"
                class="text-gray-500 dark:text-gray-400"
              />
              <span>{{ slotItem.title }}</span>
            </div>
          </template>

          <!-- Кастомизация описания -->
          <template #description="{ item: slotItem }">
            <div class="flex justify-between items-center">
              <div class="text-sm">
                {{ slotItem.description }}
              </div>
              <UBadge
                color="primary"
                variant="subtle"
                class="ml-2 whitespace-nowrap"
              >
                {{ formatHours(Number(slotItem.hoursSpent)) }}
              </UBadge>
            </div>
          </template>

          <!-- Кастомизация индикатора (иконка) -->
          <template #indicator>
            <div
              class="flex items-center justify-center h-full w-full timeline-custom-indicator"
            >
              <UIcon name="i-lucide-clock" class="text-primary-400" />
            </div>
          </template>
        </UiTimeline>
      </div>
    </template>
  </UCard>
</template>

<style scoped>
/* Стили для карточки и заголовка */
.worklog-timeline {
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  /* Добавляем стили для соответствия отображению таблицы */
  --shadow-color: 0deg 0% 50%;
  --shadow-elevation-low: 0px 0.5px 0.6px hsl(var(--shadow-color) / 0.15);
  box-shadow: var(--shadow-elevation-low);
  border-radius: 0.5rem;
}

/* Контейнер с содержимым ворклогов */
.worklog-content {
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 16rem);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 16px; /* Небольшой отступ от края */
  margin-right: -8px;
}

/* Стилизация скролл-бара для webkit браузеров */
.worklog-content::-webkit-scrollbar {
  width: 4px; /* Тонкий скролл-бар */
}

.worklog-content::-webkit-scrollbar-track {
  background: transparent;
}

.worklog-content::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 2px;
}

.worklog-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}

/* Темная тема для скролл-бара */
.dark .worklog-content::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.4);
}

.dark .worklog-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.6);
}

/* Все стили для разделителя между заголовком и контентом 
   применяются напрямую в шаблоне через классы */

/* Стилизация индикатора */
:deep(.timeline-custom-indicator) {
  border-radius: 50%;
  background-color: #202a3c !important; /* Темный фон как на скриншоте */
}

/* Адаптация под темную тему */
:deep(.dark .timeline-separator) {
  background-color: rgba(
    209,
    213,
    219,
    0.12
  ) !important; /* Цвет ближе к разделителю таблицы для темной темы */
}

/* Настройка адаптивности */
@media (max-width: 1024px) {
  .worklog-timeline {
    max-height: calc(100vh - 4rem);
  }
}

@media (max-width: 640px) {
  .worklog-timeline {
    max-height: calc(100vh - 6rem);
  }
}
</style>
