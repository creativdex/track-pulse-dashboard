<script setup lang="ts">
import { ref, computed } from 'vue';
import { WorkloadByUsersTable, useWorkloadByUsersStore } from '~/features/workload';
import { useWorkloadPeriod } from '~/features/workload/composables/useWorkloadPeriod';

// Инициализация стора и композаблов
const workloadByUsersStore = useWorkloadByUsersStore();
const period = useWorkloadPeriod();

// Локальное состояние
const isLoading = ref(false);

// Вычисляемые свойства
const canLoadData = computed(() => {
  return period.startSimple.value && period.endSimple.value;
});

// Методы
async function loadData() {
  if (!canLoadData.value) {
    return;
  }

  isLoading.value = true;
  try {
    const fromFormatted = period.formatDateValue(period.startSimple.value!);
    const toFormatted = period.formatDateValue(period.endSimple.value!);
    
    await workloadByUsersStore.loadData(fromFormatted, toFormatted);
  } finally {
    isLoading.value = false;
  }
}

function clearData() {
  workloadByUsersStore.clearData();
}
</script>

<template>
  <div class="px-6">
    <!-- Панель управления периодом -->
    <UCard class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <!-- Селектор периода -->
        <div class="flex-1">
          <UPopover>
            <UButton
              variant="outline"
              icon="i-heroicons-calendar-days"
              size="sm"
              trailing-icon="i-heroicons-chevron-down"
            >
              {{
                period.startSimple.value && period.endSimple.value
                  ? `${period.formatDateForDisplay(period.startSimple.value)} — ${period.formatDateForDisplay(period.endSimple.value)}`
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
                    @click="period.preSetedDataRange(period.EPreSetedDataRange.TODAY)"
                  />
                  <UButton
                    label="Неделя"
                    variant="outline"
                    size="xs"
                    class="flex-1"
                    @click="period.preSetedDataRange(period.EPreSetedDataRange.WEEK)"
                  />
                  <UButton
                    label="Месяц"
                    variant="outline"
                    size="xs"
                    class="flex-1"
                    @click="period.preSetedDataRange(period.EPreSetedDataRange.MONTH)"
                  />
                </div>
                <UCalendar
                  :model-value="period.calendarRange.value"
                  range
                  @update:model-value="period.handleCalendarUpdate"
                />
              </div>
            </template>
          </UPopover>
        </div>

        <!-- Кнопки управления -->
        <div class="flex gap-2">
          <UButton
            color="primary"
            size="sm"
            icon="i-heroicons-arrow-path"
            :loading="isLoading"
            :disabled="!canLoadData"
            @click="loadData"
          >
            Загрузить данные
          </UButton>
          
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            icon="i-heroicons-x-mark"
            @click="clearData"
          >
            Очистить
          </UButton>
        </div>
      </div>

      <!-- Ошибка -->
      <UAlert
        v-if="workloadByUsersStore.error"
        icon="i-heroicons-exclamation-triangle"
        color="error"
        variant="soft"
        class="mt-4"
        :title="workloadByUsersStore.error"
      />
    </UCard>

    <!-- Таблица -->
    <WorkloadByUsersTable 
      :data="workloadByUsersStore.data"
      :loading="workloadByUsersStore.loading || isLoading"
    />
  </div>
</template>

<script lang="ts">
export default {
  name: "WorkloadByUsersPage",
};
</script>
