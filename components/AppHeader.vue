<template>
  <header class="bg-white dark:bg-gray-800 shadow py-3">
    <div class="container mx-auto px-4 flex justify-between items-center">
      <!-- Логотип и название -->
      <div class="flex items-center">
        <NuxtLink to="/dashboard" class="flex items-center space-x-2">
          <UIcon
            name="i-heroicons-chart-bar"
            class="text-primary-500 text-2xl"
          />
          <span class="font-semibold text-lg text-gray-900 dark:text-white"
            >TrackPulse</span
          >
        </NuxtLink>
      </div>

      <!-- Меню для авторизованного пользователя -->
      <div v-if="auth.isAuthenticated" class="flex items-center space-x-4">
        <!-- Профиль пользователя -->
        <UDropdownMenu :items="userMenuItems">
          <UButton
            variant="ghost"
            class="flex items-center space-x-2"
          >
            <!-- Заглушка аватара вместо динамического изображения -->
            <UAvatar
              icon="i-heroicons-user"
              :text="getUserInitials"
              size="sm"
            />
            <span class="text-sm hidden md:inline-block">{{
              getDisplayName
            }}</span>
            <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" />
          </UButton>
        </UDropdownMenu>

        <!-- Кнопка выхода -->
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-left-on-rectangle"
          size="sm"
          class="rounded-full"
          title="Выйти"
          @click="handleLogout"
        >
          <span class="hidden md:inline-block">Выйти</span>
        </UButton>
        
        <!-- Переключатель темы (перемещен вправо) -->
        <ThemeToggler />
      </div>

      <!-- Для неавторизованного пользователя -->
      <div v-else class="flex items-center space-x-2">
        <UButton to="/auth" color="primary" variant="soft" size="sm">
          Войти
        </UButton>
        <UButton to="/registration" color="neutral" variant="outline" size="sm">
          Регистрация
        </UButton>
        
        <!-- Переключатель темы (перемещен вправо) -->
        <ThemeToggler />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { EUserRole } from "~/features/auth/enum/roleUserEnum";
import { useAuthStore } from "~/features/auth/stores/useAuthStore";

// Используем интерфейс IProfileUser для профиля
type IProfileUser = {
  login: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  isActive: boolean;
};

const auth = useAuthStore();
const router = useRouter();

// Получаем инициалы пользователя для аватара
const getUserInitials = computed(() => {
  if (!auth.user) return "?";

  const user = auth.user as unknown as IProfileUser;

  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(
      0
    )}`.toUpperCase();
  } else if (user.firstName) {
    return user.firstName.charAt(0).toUpperCase();
  }

  return user.login.charAt(0).toUpperCase();
});

// Получаем отображаемое имя пользователя
const getDisplayName = computed(() => {
  if (!auth.user) return "";

  const user = auth.user as unknown as IProfileUser;

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  } else if (user.firstName) {
    return user.firstName;
  }

  return user.login;
});

// Функции навигации
const goToProfile = () => {
  router.push("/profile");
};

const goToEmployees = () => {
  router.push("/employees");
};

const goToAdminUsers = () => {
  router.push("/admin/users");
};

// Элементы выпадающего меню пользователя
const userMenuItems = computed(() => {
  const baseItems = [
    [
      {
        label: "Мой профиль",
        icon: "i-heroicons-user-circle",
        onSelect: goToProfile,
      },
    ],
  ];

  // Добавляем админские пункты для администраторов
  if (auth.user?.role === EUserRole.ADMIN || auth.user?.role === EUserRole.FATHER) {
    baseItems.push([
      {
        label: "Управление сотрудниками",
        icon: "i-heroicons-users",
        onSelect: goToEmployees,
      },
      {
        label: "Управление пользователями",
        icon: "i-heroicons-user-group",
        onSelect: goToAdminUsers,
      },
    ]);
  }

  baseItems.push([
    {
      label: "Выйти",
      icon: "i-heroicons-arrow-left-on-rectangle",
      onSelect: handleLogout,
    },
  ]);

  return baseItems;
});

// Обработчик выхода
async function handleLogout() {
  await auth.logout();
  router.push("/auth");
}
</script>
