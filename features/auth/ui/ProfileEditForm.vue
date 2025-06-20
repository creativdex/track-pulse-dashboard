<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">Личная информация</h3>
    </template>

    <UForm
      :schema="profileSchema"
      :state="formData"
      class="space-y-6"
      @submit="handleSubmit"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UFormGroup label="Имя" name="firstName">
          <UInput
            v-model="formData.firstName"
            placeholder="Введите имя"
            :disabled="!isEditing"
            icon="i-heroicons-user"
          />
        </UFormGroup>

        <UFormGroup label="Фамилия" name="lastName">
          <UInput
            v-model="formData.lastName"
            placeholder="Введите фамилию"
            :disabled="!isEditing"
            icon="i-heroicons-user"
          />
        </UFormGroup>

        <UFormGroup label="Логин" name="login">
          <UInput
            :model-value="user?.login"
            disabled
            icon="i-heroicons-at-symbol"
          />
        </UFormGroup>

        <UFormGroup label="Роль" name="role">
          <UInput
            :model-value="roleDisplayName"
            disabled
            :icon="roleIcon"
          />
        </UFormGroup>
      </div>

      <UDivider v-if="isEditing" />

      <div v-if="isEditing" class="flex justify-end space-x-3">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="isSubmitting"
          @click="handleCancel"
        >
          Отменить
        </UButton>
        <UButton
          type="submit"
          :loading="isSubmitting"
          :disabled="isSubmitting"
        >
          Сохранить изменения
        </UButton>
      </div>
    </UForm>
  </UCard>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/useAuthStore';
import { UpdateProfileSchema } from '../schemas/updateProfileSchema';

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
  isSaving?: boolean;
  initialData: {
    firstName: string;
    lastName: string;
  };
}

interface Emits {
  (e: 'cancel' | 'saved'): void;
}

const props = withDefaults(defineProps<Props>(), {
  isSaving: false
});

const emit = defineEmits<Emits>();

const authStore = useAuthStore();
const toast = useToast();

// Валидационная схема профиля (используем оригинальную схему API)
const profileSchema = UpdateProfileSchema;

// Локальные данные формы
const formData = ref({
  firstName: props.initialData.firstName,
  lastName: props.initialData.lastName
});

// Состояние загрузки
const isSubmitting = ref(false);

// Функции для отображения роли
const roleDisplayName = computed(() => {
  const roles: Record<string, string> = {
    'admin': 'Администратор',
    'manager': 'Менеджер',
    'employee': 'Сотрудник',
    'user': 'Пользователь'
  };
  return roles[props.user?.role || ''] || props.user?.role || 'Неизвестно';
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

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    // Валидируем данные
    const validatedData = profileSchema.parse(formData.value);
    
    // Отправляем на сервер
    const result = await authStore.updateCurrentProfile(validatedData);
    
    if (result) {
      toast.add({
        title: 'Профиль обновлен',
        description: 'Ваши данные успешно сохранены',
        icon: 'i-heroicons-check-circle',
        color: 'success'
      });
      
      emit('saved');
    }
  } catch (error: unknown) {
    console.error('Ошибка при сохранении профиля:', error);
    
    let errorMessage = 'Не удалось сохранить изменения профиля';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    toast.add({
      title: 'Ошибка сохранения',
      description: errorMessage,
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  // Сбрасываем форму к исходным данным
  formData.value = {
    firstName: props.initialData.firstName,
    lastName: props.initialData.lastName
  };
  emit('cancel');
};

// Следим за изменениями исходных данных
watch(() => props.initialData, (newData) => {
  formData.value = {
    firstName: newData.firstName,
    lastName: newData.lastName
  };
}, { deep: true });
</script>
