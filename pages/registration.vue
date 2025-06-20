<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"
  >
    <UCard class="w-full max-w-md border-0 shadow-xl">
      <template #header>
        <div class="flex flex-col items-center space-y-2 mb-2">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">
            Регистрация
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Создайте аккаунт в TrackPulse
          </p>
        </div>
      </template>

      <form @submit.prevent="submit">
        <!-- Показ общей ошибки -->
        <UAlert
          v-if="formError"
          color="error"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          class="mb-4"
          :title="formError"
        />

        <div class="mb-5">
          <UFormField
            label="Логин"
            :error="loginError"
            :ui="{
              label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            }"
            class="w-full"
          >
            <UInput
              v-model="login"
              type="text"
              placeholder="Введите логин"
              size="lg"
              :color="loginError ? 'error' : (login && isLoginValid ? 'success' : 'primary')"
              variant="outline"
              icon="i-heroicons-user"
              class="w-full"
            />
            <template #help>
              <div class="text-xs text-gray-500 mt-1">
                <div :class="{ 'text-green-600': login.length >= 3 && login.length <= 20, 'text-red-600': login && (login.length < 3 || login.length > 20) }">
                  ✓ От 3 до 20 символов
                </div>
                <div :class="{ 'text-green-600': /^[a-zA-Z0-9_-]*$/.test(login), 'text-red-600': login && !/^[a-zA-Z0-9_-]*$/.test(login) }">
                  ✓ Только латинские буквы, цифры, _ и -
                </div>
                <div :class="{ 'text-green-600': !login.includes(' '), 'text-red-600': login.includes(' ') }">
                  ✓ Без пробелов
                </div>
              </div>
            </template>
          </UFormField>
        </div>

        <div class="mb-5">
          <UFormField
            label="Имя (необязательно)"
            :error="firstNameError"
            :ui="{
              label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            }"
            class="w-full"
          >
            <UInput
              v-model="firstName"
              type="text"
              placeholder="Введите имя"
              size="lg"
              :color="firstNameError ? 'error' : 'primary'"
              variant="outline"
              icon="i-heroicons-identification"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="mb-5">
          <UFormField
            label="Фамилия (необязательно)"
            :error="lastNameError"
            :ui="{
              label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            }"
            class="w-full"
          >
            <UInput
              v-model="lastName"
              type="text"
              placeholder="Введите фамилию"
              size="lg"
              :color="lastNameError ? 'error' : 'primary'"
              variant="outline"
              icon="i-heroicons-identification"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="mb-5">
          <UFormField
            label="Пароль"
            :error="passwordError"
            :ui="{
              label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            }"
            class="w-full"
          >
            <UInput
              v-model="password"
              type="password"
              placeholder="Введите пароль"
              size="lg"
              :color="passwordError ? 'error' : (password && password.length >= 6 ? 'success' : 'primary')"
              variant="outline"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
            <template #help>
              <div class="text-xs text-gray-500 mt-1">
                <div :class="{ 'text-green-600': password.length >= 6, 'text-red-600': password && password.length < 6 }">
                  ✓ Минимум 6 символов
                </div>
                <div :class="{ 'text-green-600': /[a-zA-Z]/.test(password) && /[0-9]/.test(password), 'text-red-600': password && (!(/[a-zA-Z]/.test(password)) || !(/[0-9]/.test(password))) }">
                  ✓ Содержит буквы и цифры
                </div>
              </div>
            </template>
          </UFormField>
        </div>

        <div class="mb-5">
          <UFormField
            label="Подтверждение пароля"
            :error="passwordConfirmError"
            :ui="{
              label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            }"
            class="w-full"
          >
            <UInput
              v-model="passwordConfirm"
              type="password"
              placeholder="Повторите пароль"
              size="lg"
              :color="passwordConfirmError ? 'error' : (passwordConfirm && password === passwordConfirm ? 'success' : 'primary')"
              variant="outline"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
            <template #help>
              <div class="text-xs text-gray-500 mt-1">
                <div :class="{ 'text-green-600': passwordConfirm && password === passwordConfirm, 'text-red-600': passwordConfirm && password !== passwordConfirm }">
                  ✓ Пароли должны совпадать
                </div>
              </div>
            </template>
          </UFormField>
        </div>

        <!-- Используем компонент для области сообщений -->
        <MessageArea :messages="formMessages" animate />

        <div class="flex justify-between items-center text-sm mt-4">
          <UCheckbox
            v-model="acceptTerms"
            label="Я принимаю условия"
            :color="termsError ? 'error' : 'primary'"
          />
          <NuxtLink to="/auth">
            <UButton variant="link" color="primary" size="xs">Уже есть аккаунт?</UButton>
          </NuxtLink>
        </div>

        <UButton
          type="submit"
          block
          color="primary"
          size="lg"
          variant="solid"
          class="mt-4 h-11"
          icon="i-heroicons-user-plus"
          :loading="isLoading"
          :disabled="isLoading || !isFormValid"
        >
          {{ isLoading ? "Регистрация..." : "Зарегистрироваться" }}
        </UButton>

        <!-- Показываем, что не заполнено -->
        <div v-if="!isFormValid" class="mt-3">
          <div class="text-xs text-gray-500">
            <p class="font-medium mb-1">Для активации кнопки необходимо:</p>
            <ul class="space-y-1">
              <li v-if="!isLoginValid" class="flex items-center">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-red-500 mr-1" />
                Корректно заполнить логин
              </li>
              <li v-if="password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)" class="flex items-center">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-red-500 mr-1" />
                Создать надёжный пароль
              </li>
              <li v-if="password !== passwordConfirm" class="flex items-center">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-red-500 mr-1" />
                Подтвердить пароль
              </li>
              <li v-if="!acceptTerms" class="flex items-center">
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3 text-red-500 mr-1" />
                Принять условия
              </li>
            </ul>
          </div>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/features/auth/stores/useAuthStore";

// Реактивные переменные для формы
const login = ref("");
const firstName = ref("");
const lastName = ref("");
const password = ref("");
const passwordConfirm = ref("");
const acceptTerms = ref(false);

// Реактивные переменные для обработки состояния и ошибок
const formError = ref("");
const isLoading = ref(false);
const formMessages = ref<
  { type: "error" | "info" | "warning" | "success"; text: string }[]
>([]);

// Вычисляемые свойства для отображения ошибок полей
const firstNameError = computed(() => {
  // Имя необязательное, ошибки показываем только если есть общая ошибка формы
  return "";
});

const lastNameError = computed(() => {
  // Фамилия необязательная, ошибки показываем только если есть общая ошибка формы
  return "";
});

const passwordError = computed(() => {
  if (formError.value) {
    if (!password.value) return "Введите пароль";
    if (password.value.length < 6)
      return "Пароль должен содержать минимум 6 символов";
    if (!/[a-zA-Z]/.test(password.value) || !/[0-9]/.test(password.value))
      return "Пароль должен содержать буквы и цифры";
  }
  return "";
});

const passwordConfirmError = computed(() => {
  if (formError.value && password.value !== passwordConfirm.value) {
    return "Пароли не совпадают";
  }
  return "";
});

const termsError = computed(() => {
  return formError.value && !acceptTerms.value;
});

// Функция для проверки логина по регулярному выражению
function validateLogin(login: string): boolean {
  // Логин должен содержать только буквы латинского алфавита, цифры и знаки подчёркивания/дефисы
  // Длина от 3 до 20 символов
  const loginRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return loginRegex.test(login);
}

// Валидация логина в реальном времени
const isLoginValid = computed(() => {
  return login.value && validateLogin(login.value) && !login.value.includes(' ');
});

// Обновляем вычисляемое свойство для проверки логина
const loginError = computed(() => {
  if (formError.value) {
    if (!login.value.trim()) return "Введите логин";
    if (login.value.includes(' ')) return "Логин не должен содержать пробелов";
    if (!validateLogin(login.value)) return "Неверный формат логина";
  }
  return "";
});

// Улучшаем проверку валидности формы
const isFormValid = computed(() => {
  const loginValid = login.value.trim() !== "" && validateLogin(login.value) && !login.value.includes(' ');
  // Имя и фамилия необязательные
  const passwordValid = password.value.length >= 6 && 
    /[a-zA-Z]/.test(password.value) && 
    /[0-9]/.test(password.value);
  const passwordMatchValid = password.value === passwordConfirm.value;
  const termsValid = acceptTerms.value;

  return loginValid && passwordValid && passwordMatchValid && termsValid;
});

const auth = useAuthStore();

// Функция проверки формы
function validateForm() {
  formError.value = "";
  formMessages.value = [];

  // Проверка логина
  if (!login.value.trim()) {
    formError.value = "Пожалуйста, заполните обязательные поля";
    return false;
  }

  if (!validateLogin(login.value)) {
    formError.value = "Ошибка в форме";
    formMessages.value.push({
      type: "error",
      text: "Логин должен содержать от 3 до 20 символов и состоять из букв латинского алфавита, цифр, и символов '_' или '-'",
    });
    return false;
  }

  // Проверка пароля
  if (!password.value || password.value.length < 6) {
    formError.value = "Ошибка в форме";
    formMessages.value.push({
      type: "error",
      text: "Пароль должен содержать минимум 6 символов",
    });
    return false;
  }

  if (!/[a-zA-Z]/.test(password.value) || !/[0-9]/.test(password.value)) {
    formError.value = "Ошибка в форме";
    formMessages.value.push({
      type: "error",
      text: "Пароль должен содержать буквы и цифры",
    });
    return false;
  }

  if (password.value !== passwordConfirm.value) {
    formError.value = "Ошибка в форме";
    formMessages.value.push({
      type: "error",
      text: "Пароли не совпадают",
    });
    return false;
  }

  if (!acceptTerms.value) {
    formError.value = "Ошибка в форме";
    formMessages.value.push({
      type: "error",
      text: "Необходимо принять условия использования",
    });
    return false;
  }

  return true;
}

async function submit() {
  if (!validateForm()) return;

  isLoading.value = true;
  formMessages.value = [];

  try {
    const success = await auth.register({
      login: login.value,
      firstName: firstName.value,
      lastName: lastName.value,
      password: password.value,
    });

    if (success) {
      formMessages.value = [
        {
          type: "success",
          text: "Регистрация прошла успешно! Сейчас вы будете перенаправлены на страницу входа.",
        },
      ];

      setTimeout(() => {
        navigateTo("/auth");
      }, 2000);
    }
  } catch (error) {
    console.error("Ошибка регистрации:", error);

    formError.value = "Ошибка при регистрации";

    // Добавляем сообщение об ошибке, извлекая текст из объекта ошибки
    formMessages.value.push({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Произошла ошибка при регистрации",
    });
  } finally {
    isLoading.value = false;
  }
}
</script>
