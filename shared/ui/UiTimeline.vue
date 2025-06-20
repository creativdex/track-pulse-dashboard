<script setup lang="ts" generic="T extends TimelineItem">
import { computed } from 'vue';

export interface TimelineItem {
  date?: string;
  title?: string;
  description?: string;
  icon?: string;
  value?: string | number;
  slot?: string;
  class?: string | string[] | Record<string, boolean>;
  [key: string]: unknown;
}

export interface TimelineProps<T extends TimelineItem = TimelineItem> {
  /**
   * The element or component this component should render as.
   * @defaultValue 'div'
   */
  as?: string;
  items: T[];
  /**
   * @defaultValue 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * @defaultValue 'primary'
   */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral';
  /**
   * The orientation of the Timeline.
   * @defaultValue 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  defaultValue?: string | number;
  reverse?: boolean;
  class?: string | string[] | Record<string, boolean>;
}

type SlotProps<T extends TimelineItem> = (props: { item: T }) => unknown;

type TimelineSlots<T extends TimelineItem> = {
  indicator?: SlotProps<T>;
  date?: SlotProps<T>;
  title?: SlotProps<T>;
  description?: SlotProps<T>;
  [key: string]: SlotProps<T> | undefined;
};

const props = withDefaults(defineProps<TimelineProps<T>>(), {
  as: 'div',
  orientation: 'vertical',
  size: 'md',
  color: 'primary',
  reverse: false,
  defaultValue: undefined,
  class: undefined
});

defineSlots<TimelineSlots<T>>();

const modelValue = defineModel<string | number>();

// Классы для корневого элемента
const rootClass = computed(() => {
  const classes = [
    'timeline',
    `timeline-${props.orientation}`,
    `timeline-${props.size}`,
    props.class
  ];
  
  return classes.filter(Boolean).join(' ');
});

// Вычисляем текущий активный шаг
const currentStepIndex = computed(() => {
  const value = modelValue.value ?? props.defaultValue;

  if (typeof value === 'string') {
    return props.items.findIndex(item => item.value === value) ?? -1;
  }

  if (props.reverse) {
    return value != null ? props.items.length - 1 - Number(value) : -1;
  } else {
    return value != null ? Number(value) : -1;
  }
});

// Получаем состояние элемента (активный, завершенный)
function getItemState(index: number): 'active' | 'completed' | undefined {
  if (currentStepIndex.value === -1) return undefined;
  if (index === currentStepIndex.value) return 'active';

  if (props.reverse) {
    return index > currentStepIndex.value ? 'completed' : undefined;
  } else {
    return index < currentStepIndex.value ? 'completed' : undefined;
  }
}

// Классы для индикатора в зависимости от состояния
function getIndicatorClass(index: number) {
  const state = getItemState(index);
  const baseClass = 'timeline-indicator';
  
  const stateClass = state === 'active' 
    ? `timeline-indicator-active bg-${props.color}-500` 
    : state === 'completed' 
      ? `timeline-indicator-completed bg-${props.color}-500` 
      : `timeline-indicator-default bg-neutral-200 dark:bg-neutral-700`;
  
  const sizeClass = `timeline-indicator-${props.size}`;
  
  return `${baseClass} ${stateClass} ${sizeClass}`;
}

// Классы для разделителя
function getSeparatorClass(index: number) {
  const state = getItemState(index);
  
  const stateClass = state === 'active' || state === 'completed'
    ? `bg-${props.color}-500`
    : 'bg-neutral-200 dark:bg-neutral-700';
  
  return `timeline-separator ${stateClass}`;
}
</script>

<template>
  <component :is="as" :data-orientation="orientation" :class="rootClass">
    <div
      v-for="(item, index) in items"
      :key="item.value ?? index"
      :class="[
        'timeline-item',
        { 'timeline-item-active': getItemState(index) === 'active' },
        { 'timeline-item-completed': getItemState(index) === 'completed' },
        item.class
      ]"
      :data-state="getItemState(index)"
    >
      <!-- Контейнер для индикатора и разделителя -->
      <div class="timeline-container">
        <!-- Индикатор (аватар или иконка) -->
        <UAvatar 
          :size="size" 
          :icon="item.icon" 
          v-bind="typeof item.avatar === 'object' ? item.avatar : {}" 
          :class="getIndicatorClass(index)"
        >
          <slot 
            :name="item.slot ? `${item.slot}-indicator` : 'indicator'" 
            :item="item"
          />
        </UAvatar>

        <!-- Разделитель между элементами -->
        <div
          v-if="index < items.length - 1"
          :class="getSeparatorClass(index)"
        />
      </div>

      <!-- Контент элемента (дата, заголовок, описание) -->
      <div class="timeline-wrapper">
        <div v-if="item.date" class="timeline-date">
          <slot :name="item.slot ? `${item.slot}-date` : 'date'" :item="item">
            {{ item.date }}
          </slot>
        </div>
        <div v-if="item.title || $slots.title" class="timeline-title">
          <slot :name="item.slot ? `${item.slot}-title` : 'title'" :item="item">
            {{ item.title }}
          </slot>
        </div>
        <div v-if="item.description || $slots.description" class="timeline-description">
          <slot :name="item.slot ? `${item.slot}-description` : 'description'" :item="item">
            {{ item.description }}
          </slot>
        </div>
      </div>
    </div>
  </component>
</template>

<style scoped>
.timeline {
  display: flex;
  width: 100%;
}

.timeline-vertical {
  flex-direction: column;
}

.timeline-horizontal {
  flex-direction: row;
  align-items: flex-start;
}

.timeline-item {
  display: flex;
  position: relative;
}

.timeline-vertical .timeline-item {
  flex-direction: row;
  margin-bottom: 1.5rem;
}

.timeline-horizontal .timeline-item {
  flex-direction: column;
  align-items: center;
  margin-right: 1.5rem;
}

.timeline-container {
  display: flex;
  position: relative;
}

.timeline-vertical .timeline-container {
  flex-direction: column;
  align-items: center;
  margin-right: 1rem;
}

.timeline-horizontal .timeline-container {
  flex-direction: row;
  justify-content: center;
  width: 100%;
  margin-bottom: 0.75rem;
}

.timeline-indicator {
  z-index: 10;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-indicator-xs { width: 1.5rem; height: 1.5rem; }
.timeline-indicator-sm { width: 2rem; height: 2rem; }
.timeline-indicator-md { width: 2.5rem; height: 2.5rem; }
.timeline-indicator-lg { width: 3rem; height: 3rem; }
.timeline-indicator-xl { width: 3.5rem; height: 3.5rem; }

.timeline-separator {
  position: absolute;
}

.timeline-vertical .timeline-separator {
  width: 0.125rem;
  top: 2.5rem;
  bottom: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
}

.timeline-horizontal .timeline-separator {
  height: 0.125rem;
  left: 2.5rem;
  right: -1.5rem;
  top: 50%;
  transform: translateY(-50%);
}

.timeline-wrapper {
  flex: 1;
}

.timeline-vertical .timeline-wrapper {
  padding-top: 0.25rem;
}

.timeline-horizontal .timeline-wrapper {
  text-align: center;
  max-width: 10rem;
}

.timeline-date {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #64748b);
  margin-bottom: 0.25rem;
}

.timeline-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.timeline-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary, #64748b);
}

/* Адаптация размеров разделителя под разные размеры индикатора */
.timeline-vertical .timeline-indicator-xs + .timeline-separator { top: 1.5rem; }
.timeline-vertical .timeline-indicator-sm + .timeline-separator { top: 2rem; }
.timeline-vertical .timeline-indicator-lg + .timeline-separator { top: 3rem; }
.timeline-vertical .timeline-indicator-xl + .timeline-separator { top: 3.5rem; }

.timeline-horizontal .timeline-indicator-xs + .timeline-separator { left: 1.5rem; }
.timeline-horizontal .timeline-indicator-sm + .timeline-separator { left: 2rem; }
.timeline-horizontal .timeline-indicator-lg + .timeline-separator { left: 3rem; }
.timeline-horizontal .timeline-indicator-xl + .timeline-separator { left: 3.5rem; }
</style>
