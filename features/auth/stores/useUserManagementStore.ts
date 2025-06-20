import { defineStore } from "pinia";
import { getAllUsers, updateUserStatus, setUserPassword } from "../api/client";
import type { IProfile } from "../schemas/profileSchema";
import { useAuthStore } from "./useAuthStore";

export const useUserManagementStore = defineStore("userManagement", () => {
  const users = ref<IProfile[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  // Геттеры
  const activeUsers = computed(() => users.value.filter(user => user.isActive));
  const inactiveUsers = computed(() => users.value.filter(user => !user.isActive));
  const totalUsers = computed(() => users.value.length);

  // Статистика
  const stats = computed(() => ({
    total: totalUsers.value,
    active: activeUsers.value.length,
    inactive: inactiveUsers.value.length,
  }));

  // Очистка ошибки
  function clearError() {
    error.value = null;
  }

  // Загрузка всех пользователей
  async function loadUsers() {
    if (!authStore.accessToken) {
      error.value = "Токен доступа отсутствует";
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      const fetchedUsers = await getAllUsers(authStore.accessToken);
      users.value = fetchedUsers;
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Ошибка при загрузке пользователей";
      console.error("Ошибка загрузки пользователей:", err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Изменение статуса пользователя
  async function toggleUserStatus(userId: string) {
    if (!authStore.accessToken) {
      error.value = "Токен доступа отсутствует";
      return false;
    }

    const user = users.value.find(u => u.id === userId);
    if (!user) {
      error.value = "Пользователь не найден";
      return false;
    }

    try {
      await updateUserStatus(
        authStore.accessToken,
        userId,
        !user.isActive
      );

      // Обновляем пользователя в списке локально
      const index = users.value.findIndex(u => u.id === userId);
      if (index !== -1) {
        users.value[index].isActive = !user.isActive;
      }

      return true;
    } catch (err) {
      console.error('Ошибка при изменении статуса пользователя:', err);
      error.value = err instanceof Error ? err.message : "Ошибка при изменении статуса пользователя";
      return false;
    }
  }

  // Установка нового пароля пользователя
  async function resetPassword(userId: string) {
    if (!authStore.accessToken) {
      error.value = "Токен доступа отсутствует";
      return null;
    }

    try {
      // Генерируем временный пароль
      const temporaryPassword = Math.random().toString(36).slice(-8);
      
      await setUserPassword(authStore.accessToken, userId, temporaryPassword);
      
      return temporaryPassword;
    } catch (err) {
      console.error("Ошибка установки пароля:", err);
      error.value = err instanceof Error ? err.message : "Ошибка при установке пароля";
      return null;
    }
  }

  // Получение отображаемого имени пользователя
  function getUserDisplayName(user: IProfile): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    if (user.lastName) {
      return user.lastName;
    }
    // Проверяем, что login существует
    if (user.login) {
      return user.login;
    }
    // Fallback если все поля пустые
    return 'Неизвестный пользователь';
  }

  // Получение инициалов пользователя
  function getUserInitials(user: IProfile): string {
    if (!user) return 'NN'; // Если пользователь не передан
    
    if (user.firstName && user.firstName.length > 0 && user.lastName && user.lastName.length > 0) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName && user.firstName.length > 0) {
      return user.firstName[0].toUpperCase();
    }
    if (user.lastName && user.lastName.length > 0) {
      return user.lastName[0].toUpperCase();
    }
    // Проверяем, что login существует и не пустой
    if (user.login && user.login.length > 0) {
      return user.login.slice(0, 2).toUpperCase();
    }
    // Fallback если все поля пустые
    return 'NN';
  }

  return {
    users,
    loading,
    error,
    activeUsers,
    inactiveUsers,
    totalUsers,
    stats,
    clearError,
    loadUsers,
    toggleUserStatus,
    resetPassword,
    getUserDisplayName,
    getUserInitials,
  };
});
