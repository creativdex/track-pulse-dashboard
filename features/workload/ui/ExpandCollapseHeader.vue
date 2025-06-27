<template>
  <div class="flex justify-center items-center">
    <UButton
      :icon="isAllExpanded ? 'i-heroicons-chevron-double-up' : 'i-heroicons-chevron-double-down'"
      size="xs"
      variant="ghost"
      :title="isAllExpanded ? 'Свернуть всё' : 'Развернуть всё'"
      @click.stop="toggleAll"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TableRowItem } from '../composables/useWorkloadTable';

const props = defineProps<{
  expandAll: () => void;
  collapseAll: () => void;
  hierarchyTasks: TableRowItem[];
  expandedKeys: Set<string>;
}>();

function collectAllKeys(items: TableRowItem[], keys: string[] = []) {
  items.forEach(item => {
    if (item.children && item.children.length > 0) {
      keys.push(item.key);
      collectAllKeys(item.children, keys);
    }
  });
  return keys;
}

const allKeys = computed(() => collectAllKeys(props.hierarchyTasks));
const isAllExpanded = computed(() => allKeys.value.length > 0 && allKeys.value.every(key => props.expandedKeys.has(key)));

function toggleAll() {
  if (isAllExpanded.value) {
    props.collapseAll();
  } else {
    props.expandAll();
  }
}
</script>
