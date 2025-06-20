<!-- filepath: /Users/creativdev/Projects/track-pulse-dashboard/components/MessageArea.vue -->
<template>
  <div 
    v-if="messages.length > 0"
    class="message-area p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4"
    :class="{ 'animate-fade-in': animate }"
  >
    <ul class="space-y-1 text-sm">
      <li 
        v-for="(message, index) in messages" 
        :key="index"
        class="flex items-start"
      >
        <!-- Иконка в зависимости от типа сообщения -->
        <UIcon 
          :name="getIconByType(message.type)"
          :class="getColorByType(message.type) + ' mr-2 mt-0.5'"
        />
        
        <!-- Текст сообщения -->
        <span :class="getTextColorByType(message.type)">
          {{ message.text }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
type MessageType = 'error' | 'info' | 'warning' | 'success';

interface Message {
  type: MessageType;
  text: string;
}

// Используем деструктуризацию вместо объявления переменной props
const { messages, animate = false } = defineProps<{
  messages: Message[];
  animate?: boolean;
}>();

// Определение иконок для разных типов сообщений
function getIconByType(type: MessageType): string {
  switch (type) {
    case 'error':
      return 'i-heroicons-exclamation-circle';
    case 'warning':
      return 'i-heroicons-exclamation-triangle';
    case 'success':
      return 'i-heroicons-check-circle';
    case 'info':
    default:
      return 'i-heroicons-information-circle';
  }
}

// Определение цветов иконок
function getColorByType(type: MessageType): string {
  switch (type) {
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'success':
      return 'text-green-500';
    case 'info':
    default:
      return 'text-blue-500';
  }
}

// Определение цветов текста
function getTextColorByType(type: MessageType): string {
  switch (type) {
    case 'error':
      return 'text-red-700 dark:text-red-300';
    case 'warning':
      return 'text-yellow-700 dark:text-yellow-300';
    case 'success':
      return 'text-green-700 dark:text-green-300';
    case 'info':
    default:
      return 'text-blue-700 dark:text-blue-300';
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>