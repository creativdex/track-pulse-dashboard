<template>
  <div class="user-management">
    <!-- Заголовок и статистика -->
    <div class="header mb-6">
      <div class="flex justify-between items-center my-4">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Управление пользователями
        </h1>
        <UButton
          color="primary"
          variant="outline"
          size="sm"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="handleRefresh"
        >
          Обновить
        </UButton>
      </div>

      <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard class="text-center">
          <div class="text-2xl font-bold text-primary-600">
            {{ stats.total }}
          </div>
          <div class="text-sm text-gray-500">Всего пользователей</div>
        </UCard>
        <UCard class="text-center">
          <div class="text-2xl font-bold text-green-600">
            {{ stats.active }}
          </div>
          <div class="text-sm text-gray-500">Активных</div>
        </UCard>
        <UCard class="text-center">
          <div class="text-2xl font-bold text-red-600">
            {{ stats.inactive }}
          </div>
          <div class="text-sm text-gray-500">Неактивных</div>
        </UCard>
      </div>
    </div>

    <!-- Сообщение об ошибке -->
    <UAlert
      v-if="error"
      icon="i-heroicons-x-circle"
      color="error"
      variant="soft"
      :title="error"
      :close-button="{
        icon: 'i-heroicons-x-mark-20-solid',
        color: 'error',
        variant: 'link',
      }"
      class="mb-4"
      @close="clearError"
    />

    <!-- Загрузка -->
    <UCard v-if="loading" class="text-center py-8">
      <div class="flex items-center justify-center space-x-2">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
        <span class="text-gray-600">Загрузка пользователей...</span>
      </div>
    </UCard>

    <!-- Таблица пользователей -->
    <UCard v-else-if="users.length > 0" class="overflow-hidden">
      <UTable
        :data="users"
        :columns="columns"
        :ui="{
          td: 'px-4 py-3',
          th: 'px-4 py-3 bg-gray-50 dark:bg-gray-800',
          tr: 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        }"
      >
        <!-- Колонка с информацией о пользователе -->
        <template #user-cell="{ row }">
          <div class="flex items-center space-x-3">
            <UAvatar :text="getUserInitials(row.original)" size="sm" />
            <div class="min-w-0 flex-1">
              <div class="font-medium text-gray-900 dark:text-white truncate">
                {{ getUserDisplayName(row.original) }}
              </div>
              <div class="text-sm text-gray-500 truncate">
                @{{ row.original.login }}
              </div>
            </div>
          </div>
        </template>

        <!-- Колонка с ролью -->
        <template #role-cell="{ row }">
          <UBadge
            :color="getRoleColor(row.original.role)"
            variant="soft"
            class="capitalize"
          >
            {{ row.original.role || 'Не указана' }}
          </UBadge>
        </template>

        <!-- Колонка со статусом -->
        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.isActive ? 'success' : 'error'"
            variant="soft"
          >
            {{ row.original.isActive ? 'Активен' : 'Неактивен' }}
          </UBadge>
        </template>

        <!-- Колонка с последним входом -->
        <template #lastLogin-cell="{ row }">
          <div class="text-sm text-gray-600">
            {{ row.original.lastLoginAt ? formatDate(row.original.lastLoginAt) : 'Никогда' }}
          </div>
        </template>

        <!-- Колонка с действиями -->
        <template #actions-cell="{ row }">
          <div class="flex justify-center space-x-1">
            <!-- Переключение статуса -->
            <UButton
              :color="row.original.isActive ? 'error' : 'success'"
              variant="soft"
              size="xs"
              :icon="row.original.isActive ? 'i-heroicons-user-minus' : 'i-heroicons-user-plus'"
              :loading="actionLoading === `status-${row.original.id}`"
              @click="handleStatusToggle(row.original)"
            >
              {{ row.original.isActive ? 'Деактивировать' : 'Активировать' }}
            </UButton>

            <!-- Сброс пароля -->
            <UButton
              color="warning"
              variant="soft"
              size="xs"
              icon="i-heroicons-key"
              :loading="actionLoading === `password-${row.original.id}`"
              @click="handlePasswordReset(row.original)"
            >
              Сбросить пароль
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Пустое состояние -->
    <UCard v-else class="text-center py-12">
      <UIcon
        name="i-heroicons-users"
        class="w-16 h-16 mx-auto mb-4 text-gray-300"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Пользователи не найдены
      </h3>
      <p class="text-gray-500 mb-4">
        Список пользователей пуст или произошла ошибка загрузки
      </p>
      <UButton @click="loadUsers()"> Обновить список </UButton>
    </UCard>

    <!-- Модальное окно подтверждения изменения статуса -->
    <UModal 
      v-model:open="showStatusModal"
      title="Подтверждение действия"
      :description="`${selectedUser?.isActive ? 'Деактивировать' : 'Активировать'} пользователя ${selectedUser ? getUserDisplayName(selectedUser) : ''}?`"
    >
      <template #body>
        <div class="space-y-4">
          <p>
            Вы уверены, что хотите 
            <strong>{{ selectedUser?.isActive ? 'деактивировать' : 'активировать' }}</strong>
            пользователя <strong>{{ selectedUser ? getUserDisplayName(selectedUser) : '' }}</strong>?
          </p>
          
          <div v-if="selectedUser?.isActive" class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">
              ⚠️ Деактивированный пользователь не сможет войти в систему.
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end space-x-2">
          <UButton variant="ghost" @click="showStatusModal = false">
            Отмена
          </UButton>
          <UButton
            :color="selectedUser?.isActive ? 'error' : 'success'"
            :loading="actionLoading === `status-${selectedUser?.id}`"
            @click="confirmStatusToggle"
          >
            {{ selectedUser?.isActive ? 'Деактивировать' : 'Активировать' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Модальное окно с новым паролем -->
    <UModal 
      v-model:open="showPasswordModal"
      title="Пароль сброшен"
      :description="`Пароль для пользователя ${selectedUser ? getUserDisplayName(selectedUser) : ''} успешно сброшен`"
    >
      <template #body>
        <div class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p class="text-sm text-blue-600 dark:text-blue-400 mb-2">
              Новый временный пароль:
            </p>
            <div class="flex items-center space-x-2">
              <code class="bg-white dark:bg-gray-800 px-3 py-2 rounded border text-sm font-mono">
                {{ temporaryPassword }}
              </code>
              <UButton
                variant="ghost"
                size="xs"
                icon="i-heroicons-clipboard-document"
                @click="copyPassword"
              >
                Скопировать
              </UButton>
            </div>
          </div>
          
          <div class="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <p class="text-sm text-orange-600 dark:text-orange-400">
              ⚠️ Пользователь должен сменить пароль при первом входе.
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <UButton @click="showPasswordModal = false">
            Закрыть
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useUserManagementStore } from "../stores/useUserManagementStore";
import type { IProfile } from "../schemas/profileSchema";

const store = useUserManagementStore();

const {
  users,
  loading,
  error,
  stats,
} = storeToRefs(store);

const {
  clearError,
  loadUsers,
  toggleUserStatus,
  resetPassword,
  getUserDisplayName,
  getUserInitials,
} = store;

// Локальное состояние для действий
const actionLoading = ref<string | null>(null);
const showStatusModal = ref(false);
const showPasswordModal = ref(false);
const selectedUser = ref<IProfile | null>(null);
const temporaryPassword = ref<string>("");

// Конфигурация таблицы
const columns: TableColumn<IProfile>[] = [
  {
    id: "user",
    header: "Пользователь",
    accessorKey: "login",
  },
  {
    id: "role",
    header: "Роль",
    accessorKey: "role",
  },
  {
    id: "status",
    header: "Статус",
    accessorKey: "isActive",
  },
  {
    id: "lastLogin",
    header: "Последний вход",
    accessorKey: "lastLoginAt",
  },
  {
    id: "actions",
    header: "Действия",
    accessorKey: "id",
  },
];

// Обработчик обновления данных
async function handleRefresh() {
  await loadUsers();
}

// Получение цвета для роли
function getRoleColor(role: string | undefined): "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral" {
  if (!role) return 'neutral';
  
  switch (role.toLowerCase()) {
    case 'admin':
      return 'error';
    case 'father':
      return 'success';
    case 'viewer':
      return 'secondary';
    default:
      return 'neutral';
  }
}

// Форматирование даты
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Обработчик переключения статуса
function handleStatusToggle(user: IProfile) {
  selectedUser.value = user;
  showStatusModal.value = true;
}

// Подтверждение изменения статуса
async function confirmStatusToggle() {
  if (!selectedUser.value) return;

  actionLoading.value = `status-${selectedUser.value.id}`;

  try {
    const success = await toggleUserStatus(selectedUser.value.id);
    
    if (success) {
      const toast = useToast();
      toast.add({
        title: "Статус изменен",
        description: `Пользователь ${selectedUser.value.isActive ? 'деактивирован' : 'активирован'}`,
        icon: "i-heroicons-check-circle",
        color: "success",
      });
    } else {
      const toast = useToast();
      toast.add({
        title: "Ошибка",
        description: "Не удалось изменить статус пользователя",
        icon: "i-heroicons-x-circle",
        color: "error",
      });
    }
  } catch (err) {
    console.error('Ошибка в confirmStatusToggle:', err);
    const toast = useToast();
    toast.add({
      title: "Ошибка",
      description: "Произошла ошибка при изменении статуса",
      icon: "i-heroicons-x-circle",
      color: "error",
    });
  } finally {
    actionLoading.value = null;
    showStatusModal.value = false;
    selectedUser.value = null;
  }
}

// Обработчик сброса пароля
async function handlePasswordReset(user: IProfile) {
  selectedUser.value = user;
  actionLoading.value = `password-${user.id}`;

  try {
    const newPassword = await resetPassword(user.id);
    
    if (newPassword) {
      temporaryPassword.value = newPassword;
      showPasswordModal.value = true;
      
      const toast = useToast();
      toast.add({
        title: "Пароль сброшен",
        description: `Для пользователя ${getUserDisplayName(user)} создан новый пароль`,
        icon: "i-heroicons-key",
        color: "success",
      });
    } else {
      // Если пароль не создан
      const toast = useToast();
      toast.add({
        title: "Ошибка",
        description: "Не удалось создать новый пароль",
        icon: "i-heroicons-x-circle",
        color: "error",
      });
    }
  } catch (err) {
    console.error('Ошибка в handlePasswordReset:', err);
    const toast = useToast();
    toast.add({
      title: "Ошибка",
      description: "Произошла ошибка при сбросе пароля",
      icon: "i-heroicons-x-circle",
      color: "error",
    });
  } finally {
    actionLoading.value = null;
    selectedUser.value = null;
  }
}

// Копирование пароля в буфер обмена
async function copyPassword() {
  try {
    await navigator.clipboard.writeText(temporaryPassword.value);
    const toast = useToast();
    toast.add({
      title: "Скопировано",
      description: "Пароль скопирован в буфер обмена",
      icon: "i-heroicons-clipboard-document",
      color: "success",
    });
  } catch (error) {
    console.error("Ошибка копирования:", error);
  }
}

// Инициализация
onMounted(() => {
  loadUsers();
});
</script>
