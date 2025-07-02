<template>
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
              props.startSimple.value && props.endSimple.value
                ? `${props.formatDateForDisplay(props.startSimple.value)} — ${props.formatDateForDisplay(props.endSimple.value)}`
                : "Выберите период"
            }}
          </UButton>

          <template #content>
            <div class="flex flex-col gap-2 p-2 min-w-[220px]">
              <div class="flex gap-2 mb-2">
                <UButton
                  label="Сегодня"
                  variant="outline"
                  size="xs"
                  class="flex-1"
                  @click="handlePreSetedDataRange(props.ePreSetedDataRange.TODAY)"
                />
                <UButton
                  label="Неделя"
                  variant="outline"
                  size="xs"
                  class="flex-1"
                  @click="handlePreSetedDataRange(props.ePreSetedDataRange.WEEK)"
                />
                <UButton
                  label="Месяц"
                  variant="outline"
                  size="xs"
                  class="flex-1"
                  @click="handlePreSetedDataRange(props.ePreSetedDataRange.MONTH)"
                />
              </div>
              <UCalendar
                :model-value="props.calendarRange.value"
                range
                @update:model-value="handleCalendarUpdate"
              />
            </div>
          </template>
        </UPopover>
      </div>
      
      <!-- Селект очередей (показывается только для роли FATHER) -->
      <div v-if="showQueueSelect" class="min-w-48">
        <USelectMenu
          v-model="selectedQueue"
          :items="queueOptions"
          value-key="value"
          placeholder="Выберите очередь"
          size="sm"
          :loading="queuesLoading"
        />
      </div>
      
      <div>
        <UButton
          color="primary"
          size="sm"
          icon="i-heroicons-arrow-path"
          :loading="props.loading"
          :disabled="!props.startSimple.value || !props.endSimple.value"
          @click="handleLoadData"
        >
          Загрузить данные
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { WritableComputedRef, ComputedRef } from 'vue';
import type { CalendarDate, DateValue } from '@internationalized/date';
import type { SimpleCalendarDate, EPreSetedDataRange } from '../composables/useWorkloadPeriod';
import { useAuthStore } from '~/features/auth';
import { EUserRole } from '~/features/auth/enum/roleUserEnum';
import { getQueues } from '~/features/employee-management/api/client';
import type { ITrackerQueue } from '~/features/employee-management/schemas/employeeSchema';

const props = defineProps<{
  loading?: boolean;
  calendarRange: WritableComputedRef<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>;
  startSimple: ComputedRef<SimpleCalendarDate | undefined>;
  endSimple: ComputedRef<SimpleCalendarDate | undefined>;
  formatDateValue: (date: SimpleCalendarDate) => string;
  formatDateForDisplay: (date: SimpleCalendarDate) => string;
  preSetedDataRange: (period: EPreSetedDataRange) => void;
  ePreSetedDataRange: typeof EPreSetedDataRange;
}>();

const emit = defineEmits<{
  (e: 'load-data', payload: { from: string | null; to: string | null; queue?: string }): void;
  (e: 'update-calendar', val: { start?: DateValue; end?: DateValue } | null): void;
}>();

// Получаем текущего пользователя и его роль
const authStore = useAuthStore();

// Проверяем, нужно ли показывать селект очередей
const showQueueSelect = computed(() => {
  const show = authStore.user?.role === EUserRole.FATHER;
  console.log('showQueueSelect:', show, 'user role:', authStore.user?.role);
  return show;
});

// Состояние для очередей
const queues = ref<ITrackerQueue[]>([]);
const selectedQueue = ref<string>('');
const queuesLoading = ref(false);

// Опции для селекта очередей
const queueOptions = computed(() => 
  queues.value.map(queue => ({
    label: `${queue.name} (${queue.key})`,
    value: queue.name,
  }))
);

// Загрузка списка очередей при монтировании компонента
onMounted(async () => {
  if (showQueueSelect.value) {
    try {
      queuesLoading.value = true;
      console.log('Загружаем очереди для селекта...');
      queues.value = await getQueues();
      console.log('Очереди загружены:', queues.value);
    } catch (error) {
      console.error('Ошибка загрузки очередей:', error);
    } finally {
      queuesLoading.value = false;
    }
  }
});

function handleCalendarUpdate(val: { start?: DateValue; end?: DateValue } | null) {
  emit('update-calendar', val);
}

function handlePreSetedDataRange(period: EPreSetedDataRange) {
  props.preSetedDataRange(period);
}

const handleLoadData = () => {
  if (!props.startSimple.value || !props.endSimple.value) {
    emit('load-data', { from: null, to: null });
    return;
  }
  const from = `${props.formatDateValue(props.startSimple.value)}T00:00:00`;
  const to = `${props.formatDateValue(props.endSimple.value)}T23:59:59`;
  
  // Формируем payload с учетом выбранной очереди
  const payload: { from: string; to: string; queue?: string } = { from, to };
  
  // Добавляем очередь только если она выбрана и показывается селект
  if (showQueueSelect.value && selectedQueue.value) {
    payload.queue = selectedQueue.value;
  }
  
  emit('load-data', payload);
};
</script>
