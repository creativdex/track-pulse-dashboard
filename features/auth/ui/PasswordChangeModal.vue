<template>
  <UModal 
    v-model:open="isOpen" 
    title="Смена пароля" 
    description="Измените пароль для доступа к вашему аккаунту"
    :ui="{ footer: 'justify-end' }"
  >
    <template #body>
      <div class="p-6 space-y-6">
        <!-- Показ ошибки -->
        <UAlert
          v-if="error"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          :title="error"
          class="mb-4"
        />

        <!-- Показ успеха -->
        <UAlert
          v-if="success"
          icon="i-heroicons-check-circle"
          color="success"
          variant="soft"
          title="Пароль успешно изменен"
          description="Ваш пароль был успешно обновлен"
          class="mb-4"
        />

        <UAlert
          icon="i-heroicons-information-circle"
          color="primary"
          variant="subtle"
          title="Требования к паролю"
          description="Пароль должен содержать минимум 6 символов"
        />

        <div class="grid grid-cols-1 gap-4">
          <UFormGroup label="Текущий пароль" required>
            <UInput
              v-model="currentPassword"
              type="password"
              placeholder="Введите текущий пароль"
              icon="i-heroicons-lock-closed"
              size="md"
              :color="currentPasswordError ? 'error' : 'primary'"
              class="w-full"
            />
            <template v-if="currentPasswordError" #help>
              <span class="text-red-500 text-xs">{{ currentPasswordError }}</span>
            </template>
          </UFormGroup>

          <UFormGroup label="Новый пароль" required>
            <UInput
              v-model="newPassword"
              type="password"
              placeholder="Введите новый пароль"
              icon="i-heroicons-key"
              size="md"
              :color="newPasswordError ? 'error' : (newPassword && newPassword.length >= 6 ? 'success' : 'primary')"
              class="w-full"
            />
            <template #help>
              <div class="text-xs text-gray-500 mt-1">
                <div :class="{ 'text-green-600': newPassword.length >= 6, 'text-red-600': newPassword && newPassword.length < 6 }">
                  ✓ Минимум 6 символов
                </div>
              </div>
              <div v-if="newPasswordError" class="text-red-500 text-xs mt-1">{{ newPasswordError }}</div>
            </template>
          </UFormGroup>

          <UFormGroup label="Подтвердите новый пароль" required>
            <UInput
              v-model="confirmPassword"
              type="password"
              placeholder="Повторите новый пароль"
              icon="i-heroicons-key"
              size="md"
              :color="confirmPasswordError ? 'error' : (confirmPassword && newPassword === confirmPassword ? 'success' : 'primary')"
              class="w-full"
            />
            <template #help>
              <div class="text-xs text-gray-500 mt-1">
                <div :class="{ 'text-green-600': confirmPassword && newPassword === confirmPassword, 'text-red-600': confirmPassword && newPassword !== confirmPassword }">
                  ✓ Пароли должны совпадать
                </div>
              </div>
              <div v-if="confirmPasswordError" class="text-red-500 text-xs mt-1">{{ confirmPasswordError }}</div>
            </template>
          </UFormGroup>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3 p-6 pt-0">
        <UButton 
          label="Отменить" 
          color="neutral" 
          variant="outline" 
          :disabled="isLoading"
          @click="handleCancel" 
        />
        <UButton 
          label="Изменить пароль" 
          :loading="isLoading"
          :disabled="!isFormValid || isLoading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/useAuthStore';
import { changePasswordSchema } from '../schemas/changePasswordSchema';

interface Props {
  open: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const authStore = useAuthStore();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});

// Состояние
const isLoading = ref(false);
const error = ref('');
const success = ref(false);

// Форма
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// Валидация
const currentPasswordError = computed(() => {
  if (!currentPassword.value) return '';
  return currentPassword.value.length < 6 ? 'Пароль должен содержать минимум 6 символов' : '';
});

const newPasswordError = computed(() => {
  if (!newPassword.value) return '';
  return newPassword.value.length < 6 ? 'Пароль должен содержать минимум 6 символов' : '';
});

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return '';
  if (newPassword.value !== confirmPassword.value) {
    return 'Пароли не совпадают';
  }
  return '';
});

const isFormValid = computed(() => {
  return currentPassword.value && 
         newPassword.value && 
         confirmPassword.value &&
         currentPassword.value.length >= 6 &&
         newPassword.value.length >= 6 &&
         newPassword.value === confirmPassword.value &&
         !currentPasswordError.value &&
         !newPasswordError.value &&
         !confirmPasswordError.value;
});

const handleCancel = () => {
  isOpen.value = false;
  resetForm();
};

const handleSubmit = async () => {
  if (!isFormValid.value || isLoading.value) return;

  // Сброс состояния
  error.value = '';
  success.value = false;
  isLoading.value = true;

  try {
    // Валидация с помощью схемы
    const validatedData = changePasswordSchema.parse({
      oldPassword: currentPassword.value,
      newPassword: newPassword.value,
    });

    // Вызов метода из store
    const result = await authStore.changeCurrentPassword(validatedData);

    if (result) {
      success.value = true;
      // Закрываем модалку через 2 секунды после успеха
      setTimeout(() => {
        isOpen.value = false;
        resetForm();
      }, 2000);
    }
  } catch (err: unknown) {
    console.error('Ошибка смены пароля:', err);
    if (err instanceof Error) {
      error.value = err.message;
    } else {
      error.value = 'Произошла ошибка при смене пароля';
    }
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  error.value = '';
  success.value = false;
  isLoading.value = false;
};

// Сбрасываем форму при закрытии
watch(isOpen, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});
</script>
