import { useAuthStore } from "~/features/auth/stores/useAuthStore";

export default defineNuxtRouteMiddleware(async (to) => {
  // Если пользователь переходит на страницу auth или registration, не делаем редирект
  const isAuthPage = to.path === '/auth' || to.path === '/registration';
  
  // Инициализируем хранилище авторизации
  const authStore = useAuthStore();
  
  // Проверяем статус авторизации
  // Если токен отсутствует в памяти, пробуем восстановить сессию
  if (!authStore.isAuthenticated) {
    await authStore.init();
  }
  
  // После попытки инициализации проверяем статус авторизации
  if (authStore.isAuthenticated) {
    // Пользователь авторизован, но пытается зайти на страницу авторизации
    if (isAuthPage) {
      return navigateTo('/dashboard-extended');
    }
  } else {
    // Пользователь не авторизован, но пытается зайти на защищенную страницу
    if (!isAuthPage && to.path !== '/') {
      return navigateTo('/auth');
    }
  }
});