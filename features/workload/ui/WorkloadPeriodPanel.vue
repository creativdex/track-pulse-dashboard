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
              startSimple && endSimple
                ? `${formatDateForDisplay(startSimple)} — ${formatDateForDisplay(endSimple)}`
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
                  @click="preSetedDataRange(EPreSetedDataRange.TODAY)"
                />
                <UButton
                  label="Неделя"
                  variant="outline"
                  size="xs"
                  class="flex-1"
                  @click="preSetedDataRange(EPreSetedDataRange.WEEK)"
                />
                <UButton
                  label="Месяц"
                  variant="outline"
                  size="xs"
                  class="flex-1"
                  @click="preSetedDataRange(EPreSetedDataRange.MONTH)"
                />
              </div>
              <UCalendar v-model="calendarRange as any" range />
            </div>
          </template>
        </UPopover>
      </div>
      <div>
        <UButton
          color="primary"
          size="sm"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          :disabled="!startSimple || !endSimple"
          @click="handleLoadData"
        >
          Загрузить данные
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useWorkloadPeriod } from '../composables/useWorkloadPeriod';

const { loading } = defineProps<{ loading?: boolean }>();
const emit = defineEmits<{
  (e: 'load-data', payload: { from: string | null; to: string | null }): void;
}>();

const {
  calendarRange,
  startSimple,
  endSimple,
  formatDateValue,
  formatDateForDisplay,
  preSetedDataRange,
  EPreSetedDataRange,
} = useWorkloadPeriod();

const handleLoadData = () => {
  if (!startSimple.value || !endSimple.value) {
    emit('load-data', { from: null, to: null });
    return;
  }
  const from = `${formatDateValue(startSimple.value)}T00:00:00`;
  const to = `${formatDateValue(endSimple.value)}T23:59:59`;
  emit('load-data', { from, to });
};
</script>
