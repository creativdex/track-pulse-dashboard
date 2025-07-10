<template>
  <div class="profile-page">
    <!-- Хлебные крошки -->
    <UBreadcrumb
      :links="[
        { label: 'Главная', to: '/dashboard-extended' },
        { label: 'Профиль', to: '/profile' }
      ]"
      class="mb-6"
    />

    <!-- Заголовок с кнопкой обновления -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Мой профиль
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Управление личной информацией и настройками аккаунта
        </p>
      </div>
      <UButton
        color="primary"
        variant="outline"
        size="sm"
        icon="i-heroicons-arrow-path"
        :loading="isRefreshing"
        @click="handleRefresh"
      >
        Обновить
      </UButton>
    </div>

    <!-- Основное содержимое в контейнере -->
    <UContainer>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Левая панель - Профиль -->
        <div class="lg:col-span-1">
          <UserProfileCard
            :user="user"
            :is-editing="isEditing"
            @toggle-editing="toggleEditing"
          />

          <!-- Быстрые действия -->
          <QuickActionsCard
            @delete-account="deleteAccount"
          />
        </div>

        <!-- Правая панель - Детали и статистика -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Форма редактирования -->
          <ProfileEditForm
            :user="user"
            :is-editing="isEditing"
            :initial-data="profileForm"
            @saved="handleProfileSaved"
            @cancel="cancelEditing"
          />

          <!-- Статистика -->
          <ProfileStatsCard
            :user="user"
            :stats="stats"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '~/features/auth/stores/useAuthStore';
import UserProfileCard from '~/features/auth/ui/UserProfileCard.vue';
import QuickActionsCard from '~/features/auth/ui/QuickActionsCard.vue';
import ProfileEditForm from '~/features/auth/ui/ProfileEditForm.vue';
import ProfileStatsCard from '~/features/auth/ui/ProfileStatsCard.vue';

const auth = useAuthStore();
const { user } = storeToRefs(auth);
const toast = useToast();

// Валидационная схема профиля - убираем, схема в компоненте

// Состояние компонента
const isEditing = ref(false);
const isRefreshing = ref(false);

// Форма профиля
const profileForm = ref({
  firstName: '',
  lastName: ''
});

// Настройки пользователя - убираем, так как не используются
// const settings = ref({
//   emailNotifications: true,
//   pushNotifications: true,
//   darkMode: false
// });

// Статистика (заглушка)
const stats = ref({
  daysActive: 45,
  lastLogin: user.value?.lastLoginAt ? Math.floor((Date.now() - new Date(user.value.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
  accountAge: 30 // Заглушка для возраста аккаунта
});

// Инициализация формы
const initializeForm = () => {
  if (user.value) {
    profileForm.value = {
      firstName: user.value.firstName || '',
      lastName: user.value.lastName || ''
    };
  }
};

// Функции редактирования
const toggleEditing = () => {
  if (isEditing.value) {
    cancelEditing();
  } else {
    isEditing.value = true;
  }
};

const cancelEditing = () => {
  isEditing.value = false;
  initializeForm(); // Возвращаем исходные значения
};

const handleProfileSaved = async () => {
  // Обновляем данные профиля в форме
  if (user.value) {
    profileForm.value = {
      firstName: user.value.firstName || '',
      lastName: user.value.lastName || ''
    };
  }
  
  // Выходим из режима редактирования
  isEditing.value = false;
};

const handleRefresh = async () => {
  isRefreshing.value = true;
  
  try {
    // Обновляем профиль через API
    await auth.currentProfile();
    
    // Обновляем данные формы
    initializeForm();
    
    toast.add({
      title: 'Данные обновлены',
      description: 'Информация профиля успешно обновлена',
      icon: 'i-heroicons-check-circle',
      color: 'success'
    });
    
  } catch (error) {
    console.error('Ошибка обновления:', error);
    
    let errorMessage = 'Не удалось обновить данные профиля';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.add({
      title: 'Ошибка обновления',
      description: errorMessage,
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
  } finally {
    isRefreshing.value = false;
  }
};

// Быстрые действия
const deleteAccount = async () => {
  // Здесь должна быть модалька подтверждения
  const confirmed = confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.');
  
  if (!confirmed) return;
  
  try {
    // Имитация удаления аккаунта
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.add({
      title: 'Аккаунт будет удален',
      description: 'Запрос на удаление аккаунта отправлен администратору',
      icon: 'i-heroicons-information-circle',
      color: 'warning'
    });
  } catch (error) {
    console.error('Ошибка удаления аккаунта:', error);
    toast.add({
      title: 'Ошибка',
      description: 'Не удалось отправить запрос на удаление',
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
  }
};

// Инициализация при монтировании
onMounted(() => {
  initializeForm();
});
</script>

<style scoped>
.profile-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 16px;
  }
}
</style>
