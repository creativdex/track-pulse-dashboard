import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useWorkloadTableStore = defineStore('workloadTable', () => {
  // Состояние
  const selectedItemKey = ref<string | null>(null);
  const expandedItems = ref<Set<string>>(new Set());
  const updateTrigger = ref(0);

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

  return {
    // Состояние
    selectedItemKey,
    expandedItems,
    updateTrigger,
    
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
  };
});
