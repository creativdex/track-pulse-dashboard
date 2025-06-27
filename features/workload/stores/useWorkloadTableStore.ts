import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useWorkloadTableStore = defineStore('workloadTable', () => {
  // Состояние
  const selectedItemKey = ref<string | null>(null);
  const expandedItems = ref<Set<string>>(new Set());
  const updateTrigger = ref(0);

  // Состояние периода (start/end) для фильтрации задач
  const period = ref<{ start: string | null; end: string | null }>({ start: null, end: null });

  // Геттеры
  const isTaskSelected = computed(() => (key: string) => selectedItemKey.value === key);
  const isItemExpanded = computed(() => (key: string) => expandedItems.value.has(key));

  // Действия
  function selectTask(key: string | null) {
    selectedItemKey.value = key;
  }

  function toggleExpanded(key: string) {
    if (expandedItems.value.has(key)) {
      expandedItems.value.delete(key);
    } else {
      expandedItems.value.add(key);
    }
    updateTrigger.value++;
  }

  function setExpanded(key: string, expanded: boolean) {
    if (expanded) {
      expandedItems.value.add(key);
    } else {
      expandedItems.value.delete(key);
    }
    updateTrigger.value++;
  }

  function initializeExpanded(keys: string[]) {
    // Сбрасываем состояние и устанавливаем новое
    expandedItems.value.clear();
    keys.forEach(key => expandedItems.value.add(key));
    updateTrigger.value++;
  }

  function clearSelection() {
    selectedItemKey.value = null;
  }

  function clearExpanded() {
    expandedItems.value.clear();
    updateTrigger.value++;
  }

  // Сохраняем период в localStorage при изменении
  function savePeriodToStorage() {
    if (period.value.start && period.value.end) {
      localStorage.setItem('workloadPeriod', JSON.stringify(period.value));
    }
  }

  // Загружаем период из localStorage
  function loadPeriodFromStorage() {
    const raw = localStorage.getItem('workloadPeriod');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.start && parsed.end) {
          period.value = parsed;
        }
      } catch (e) {
        console.warn('Ошибка парсинга workloadPeriod из localStorage:', e, raw);
      }
    }
  }

  return {
    // Состояние
    selectedItemKey,
    expandedItems,
    updateTrigger,
    period,
    
    // Геттеры
    isTaskSelected,
    isItemExpanded,
    
    // Действия
    selectTask,
    toggleExpanded,
    setExpanded,
    initializeExpanded,
    clearSelection,
    clearExpanded,
    savePeriodToStorage,
    loadPeriodFromStorage,
  };
});
