<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Профиль</h3>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-heroicons-pencil-square"
          @click="$emit('toggle-editing')"
        >
          {{ isEditing ? 'Отменить' : 'Изменить' }}
        </UButton>
      </div>
    </template>

    <div class="text-center space-y-6">
      <!-- Аватар -->
      <div>
        <UAvatar
          :text="userInitials"
          size="3xl"
          class="mx-auto mb-4"
        />
        <h3 class="text-xl font-semibold">
          {{ displayName }}
        </h3>
        <p class="text-gray-500 text-sm">
          @{{ user?.login }}
        </p>
      </div>

      <!-- Роль и статус -->
      <div class="space-y-3">
        <UBadge 
          :color="roleColor"
          variant="soft"
          size="lg"
          class="px-3 py-1"
        >
          <UIcon :name="roleIcon" class="w-4 h-4 mr-2" />
          {{ roleDisplayName }}
        </UBadge>
        
        <div>
          <UBadge 
            :color="user?.isActive ? 'success' : 'error'"
            variant="soft"
          >
            <UIcon 
              :name="user?.isActive ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'" 
              class="w-4 h-4 mr-2" 
            />
            {{ user?.isActive ? 'Активен' : 'Неактивен' }}
          </UBadge>
        </div>
      </div>

      <!-- Дата последнего входа -->
      <UDivider />
      
      <div class="text-sm text-gray-500">
        <UIcon name="i-heroicons-clock" class="w-4 h-4 inline mr-2" />
        {{ lastLoginText }}
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  user: {
    id: string;
    login: string;
    role: string;
    isActive: boolean;
    firstName?: string;
    lastName?: string;
    lastLoginAt?: Date | string | null;
  } | null;
  isEditing: boolean;
}

interface Emits {
  (e: 'toggle-editing'): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

// Вычисляемые свойства
const userInitials = computed(() => {
  if (!props.user) return '?';
  
  if (props.user.firstName && props.user.lastName) {
    return `${props.user.firstName.charAt(0)}${props.user.lastName.charAt(0)}`.toUpperCase();
  } else if (props.user.firstName) {
    return props.user.firstName.charAt(0).toUpperCase();
  }
  
  return props.user.login.charAt(0).toUpperCase();
});

const displayName = computed(() => {
  if (!props.user) return '';
  
  if (props.user.firstName && props.user.lastName) {
    return `${props.user.firstName} ${props.user.lastName}`;
  } else if (props.user.firstName) {
    return props.user.firstName;
  }
  
  return props.user.login;
});

const roleDisplayName = computed(() => {
  const roles: Record<string, string> = {
    'admin': 'Администратор',
    'manager': 'Менеджер',
    'employee': 'Сотрудник',
    'user': 'Пользователь'
  };
  return roles[props.user?.role || ''] || props.user?.role || 'Неизвестно';
});

const roleColor = computed((): 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' => {
  const colors: Record<string, 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
    'admin': 'error',
    'manager': 'warning',
    'employee': 'primary',
    'user': 'neutral'
  };
  return colors[props.user?.role || ''] || 'neutral';
});

const roleIcon = computed(() => {
  const icons: Record<string, string> = {
    'admin': 'i-heroicons-shield-exclamation',
    'manager': 'i-heroicons-user-group',
    'employee': 'i-heroicons-briefcase',
    'user': 'i-heroicons-user'
  };
  return icons[props.user?.role || ''] || 'i-heroicons-user';
});

const lastLoginText = computed(() => {
  return props.user?.lastLoginAt 
    ? `Последний вход: ${formatDate(props.user.lastLoginAt)}` 
    : 'Первый вход в систему';
});

// Функция форматирования даты
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>
