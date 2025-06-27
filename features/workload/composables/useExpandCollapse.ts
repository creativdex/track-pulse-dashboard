import type { Ref } from 'vue';
import type { TableRowItem } from '../composables/useWorkloadTable';

export function useExpandCollapse(
  hierarchyTasks: Ref<TableRowItem[]>,
  tableStore: { initializeExpanded: (keys: string[]) => void }
) {
  // Массовое разворачивание
  function expandAll() {
    const collectKeys = (items: TableRowItem[], keys: string[] = []) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          keys.push(item.key);
          collectKeys(item.children, keys);
        }
      });
      return keys;
    };
    const allKeys = collectKeys(hierarchyTasks.value);
    tableStore.initializeExpanded(allKeys);
  }

  // Массовое сворачивание
  function collapseAll() {
    tableStore.initializeExpanded([]);
  }

  return {
    expandAll,
    collapseAll,
  };
}
