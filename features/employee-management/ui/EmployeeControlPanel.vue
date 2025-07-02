<template>
  <UCard class="mb-6 mx-4">
    <div class="flex flex-col gap-4">
      <!-- Основная строка с фильтрами и действиями -->
      <div class="flex flex-col lg:flex-row gap-4 items-end justify-between">
        <!-- Фильтры и поиск -->
        <div class="flex-1 flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1 max-w-sm">
            <UInput
              :model-value="searchQuery"
              placeholder="Поиск сотрудников..."
              icon="i-heroicons-magnifying-glass"
              size="sm"
              :class="{ 'pr-8': searchQuery }"
              @update:model-value="(value: string) => emit('search', value)"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              @click="emit('search', '')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Выбор типа ставки -->
          <div v-if="canConfigureRateTypes" class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Тип ставки:
            </label>
            <USelectMenu
              v-model="selectedRateType"
              :items="rateTypeOptionsFormatted"
              value-key="value"
              size="sm"
              class="min-w-32"
            />
          </div>

          <!-- Выбор проекта (если выбран тип PROJECT) -->
          <div v-if="canConfigureRateTypes && selectedRateType === 'project'" class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Проект:
            </label>
            <USelectMenu
              v-model="selectedProjectId"
              :items="projectOptions"
              value-key="value"
              placeholder="Выберите проект"
              size="sm"
              class="min-w-48"
              :loading="loadingLookups"
            />
          </div>

          <!-- Выбор очереди (если выбран тип QUEUE) -->
          <div v-if="canConfigureRateTypes && selectedRateType === 'queue'" class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Очередь:
            </label>
            <USelectMenu
              v-model="selectedQueueId"
              :items="queueOptions"
              value-key="value"
              placeholder="Выберите очередь"
              size="sm"
              class="min-w-48"
              :loading="loadingLookups"
            />
          </div>
        </div>

        <!-- Действия -->
        <div class="flex gap-2">
          <UButton
            v-if="hasUnsavedChanges"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="saving"
            @click="$emit('discard-all')"
          >
            Отменить ({{ changesCount }})
          </UButton>
          <UButton
            v-if="hasUnsavedChanges"
            color="warning"
            variant="solid"
            size="sm"
            :loading="saving"
            @click="handleSaveAll"
          >
            Сохранить ({{ changesCount }})
          </UButton>
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
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/features/auth/stores/useAuthStore';
import { useEmployeeStore } from '../stores/useEmployeeStore';
import { EUserTrackerRateType } from '../schemas/employeeSchema';

const authStore = useAuthStore();
const employeeStore = useEmployeeStore();

const { user } = storeToRefs(authStore);
const { projects, queues, loadingLookups } = storeToRefs(employeeStore);
const { loadLookups, loadEmployeesByRateType, loadEmployees } = employeeStore;

// Состояние для выбора типа ставки и контекста
const selectedRateType = ref<EUserTrackerRateType>(EUserTrackerRateType.GLOBAL);
const selectedProjectId = ref<number | undefined>();
const selectedQueueId = ref<string>('');

// Проверка прав доступа к расширенным настройкам ставок
const canConfigureRateTypes = computed(() => {
  // Все пользователи могут использовать глобальные ставки
  // Только FATHER может настраивать ставки по проектам и очередям
  return true;
});

// Опции типов ставок в зависимости от роли
const rateTypeOptions = computed(() => {
  const baseOptions = [
    EUserTrackerRateType.GLOBAL,
  ];
  
  // Дополнительные опции для ролей FATHER и ADMIN
  if (user.value?.role === 'father' || user.value?.role === 'admin') {
    baseOptions.push(
      EUserTrackerRateType.PROJECT,
      EUserTrackerRateType.QUEUE
    );
  }
  
  return baseOptions;
});

// Функция для получения названия типа ставки
const getRateTypeLabel = (type: EUserTrackerRateType) => {
  switch (type) {
    case EUserTrackerRateType.GLOBAL:
      return 'Глобальная ставка';
    case EUserTrackerRateType.PROJECT:
      return 'По проекту';
    case EUserTrackerRateType.QUEUE:
      return 'По очереди';
    default:
      return type;
  }
};

// Форматированные опции для USelect
const rateTypeOptionsFormatted = computed(() => {
  return rateTypeOptions.value.map(type => ({
    label: getRateTypeLabel(type),
    value: type
  }));
});

// Опции для выбора проектов
const projectOptions = computed(() => 
  projects.value.map(project => ({
    label: `${project.name} (ID: ${project.id})`,
    value: project.id,
  }))
);

// Опции для выбора очередей
const queueOptions = computed(() => 
  queues.value.map(queue => ({
    label: `${queue.name} (${queue.key})`,
    value: queue.name,
  }))
);

// Обработчик обновления данных
function handleRefresh() {
  let contextValue: string | undefined;
  
  switch (selectedRateType.value) {
    case EUserTrackerRateType.PROJECT:
      contextValue = selectedProjectId.value ? String(selectedProjectId.value) : undefined;
      break;
    case EUserTrackerRateType.QUEUE:
      contextValue = selectedQueueId.value || undefined;
      break;
    case EUserTrackerRateType.GLOBAL:
    default:
      contextValue = undefined;
  }

  emit('refresh-with-type', {
    rateType: selectedRateType.value,
    contextValue,
  });
}

// Обработчик сохранения с учетом выбранного типа ставки
function handleSaveAll() {
  let contextValue: string | undefined;
  
  switch (selectedRateType.value) {
    case EUserTrackerRateType.PROJECT:
      contextValue = selectedProjectId.value ? String(selectedProjectId.value) : undefined;
      break;
    case EUserTrackerRateType.QUEUE:
      contextValue = selectedQueueId.value || undefined;
      break;
    case EUserTrackerRateType.GLOBAL:
    default:
      contextValue = undefined;
  }

  // Проверяем, что для project/queue выбран контекст
  if (selectedRateType.value !== EUserTrackerRateType.GLOBAL && !contextValue) {
    const toast = useToast();
    toast.add({
      title: 'Ошибка',
      description: selectedRateType.value === EUserTrackerRateType.PROJECT 
        ? 'Выберите проект для сохранения ставок' 
        : 'Выберите очередь для сохранения ставок',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    });
    return;
  }

  emit('save-all-with-type', {
    rateType: selectedRateType.value,
    contextValue,
  });
}

// Загрузка справочников при монтировании (для ролей FATHER и ADMIN)
onMounted(async () => {
  if (user.value?.role === 'father' || user.value?.role === 'admin') {
    await loadLookups();
  }
  
  // Уведомляем родительский компонент о текущем типе ставки
  emit('rate-type-changed', selectedRateType.value);
});

// Watchers для автоматической загрузки данных при изменении выбора
watch([selectedRateType, selectedProjectId, selectedQueueId], async () => {
  await loadDataByRateType();
  
  // Уведомляем родительский компонент об изменении типа ставки
  emit('rate-type-changed', selectedRateType.value);
}, { deep: true });

// Функция для загрузки данных в зависимости от типа ставки
async function loadDataByRateType() {
  let contextValue: string | undefined;
  
  switch (selectedRateType.value) {
    case EUserTrackerRateType.PROJECT:
      contextValue = selectedProjectId.value ? String(selectedProjectId.value) : undefined;
      break;
    case EUserTrackerRateType.QUEUE:
      contextValue = selectedQueueId.value || undefined;
      break;
    case EUserTrackerRateType.GLOBAL:
    default:
      contextValue = undefined;
  }

  // Если для project/queue не выбран контекст, загружаем всех сотрудников
  if (selectedRateType.value !== EUserTrackerRateType.GLOBAL && !contextValue) {
    await loadEmployees();
    return;
  }

  // Загружаем сотрудников по типу ставки
  await loadEmployeesByRateType(selectedRateType.value, contextValue);
}

defineProps<{
  hasUnsavedChanges: boolean;
  changesCount: number;
  loading?: boolean;
  saving?: boolean;
  // Пропс для синхронизации поиска
  searchQuery?: string;
}>();

const emit = defineEmits<{
  'refresh': [];
  'refresh-with-type': [params: { rateType: EUserTrackerRateType; contextValue?: string }];
  'save-all': [];
  'save-all-with-type': [params: { rateType: EUserTrackerRateType; contextValue?: string }];
  'discard-all': [];
  'search': [query: string];
  'rate-type-changed': [rateType: EUserTrackerRateType];
}>();
</script>