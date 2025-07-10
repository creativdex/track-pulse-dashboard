<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"
  >
    <UCard class="w-full max-w-md border-0 shadow-xl">
      <template #header>
        <div class="flex flex-col items-center space-y-2 mb-2">
          <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">
            Авторизация
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Войдите в систему TrackPulse
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

        <!-- Поля формы -->
        <div class="mb-5">
          <UFormField
            :ui="{
              label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
            }"
            class="w-full"
          >
            <UInput
              v-model="login"
              type="login"
              placeholder="Введите логин"
              size="lg"
              color="primary"
              variant="outline"
              icon="i-heroicons-user"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="mb-5">
          <UFormField
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
              color="primary"
              variant="outline"
              icon="i-heroicons-lock-closed"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Используем компонент для области сообщений -->
        <MessageArea :messages="formMessages" animate />

        <!-- Остальной код формы -->
        <div class="flex justify-end items-center text-sm mt-4">
          <NuxtLink to="/registration">
            <UButton variant="link" color="primary" size="xs"
              >Создать аккаунт</UButton
            >
          </NuxtLink>
        </div>

        <UButton
          type="submit"
          block
          color="primary"
          size="lg"
          variant="solid"
          class="mt-4 h-11"
          icon="i-heroicons-arrow-right-circle"
        >
          {{ isLoading ? "Вход..." : "Войти" }}
        </UButton>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/features/auth/stores/useAuthStore";

const login = ref("");
const password = ref("");
const formError = ref("");
const isLoading = ref(false);
const formMessages = ref<
  { type: "error" | "info" | "warning" | "success"; text: string }[]
>([]);

const auth = useAuthStore();

function validateForm() {
  formError.value = "";

  if (!login.value.trim()) {
    formError.value = "Введите логин";
    return false;
  }

  if (!password.value) {
    formError.value = "Введите пароль";
    return false;
  }

  return true;
}

async function submit() {
  if (!validateForm()) return;

  isLoading.value = true;
  formMessages.value = [];

  try {
    const result = await auth.login({
      login: login.value,
      password: password.value,
    });
    if (result) {
      formMessages.value.push({
        type: "success",
        text: "Вход выполнен успешно. Перенаправление...",
      });

      setTimeout(() => {
        navigateTo("/dashboard-extended");
      }, 1000);
    } else {
      formError.value = "Ошибка авторизации";
      formMessages.value.push({
        type: "error",
        text: "Неверный логин или пароль",
      });
    }
  } catch (error) {
    // Обработка разных ошибок...
    formMessages.value.push({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Произошла ошибка при авторизации",
    });
  } finally {
    isLoading.value = false;
  }
}

// Мета-данные страницы
useSeoMeta({
  title: 'Вход | TrackPulse',
  description: 'Авторизация в системе TrackPulse для управления задачами и аналитики',
});
</script>
