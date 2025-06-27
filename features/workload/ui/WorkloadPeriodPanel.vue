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
import type { WritableComputedRef, ComputedRef } from 'vue';
import type { CalendarDate, DateValue } from '@internationalized/date';
import type { SimpleCalendarDate, EPreSetedDataRange } from '../composables/useWorkloadPeriod';

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
  (e: 'load-data', payload: { from: string | null; to: string | null }): void;
  (e: 'update-calendar', val: { start?: DateValue; end?: DateValue } | null): void;
}>();

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
  emit('load-data', { from, to });
};
</script>
