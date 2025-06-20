import { defineStore } from "pinia";
import {
  loginUser,
  refreshTokens,
  logoutUser,
  registerUser,
  getProfile,
  updateProfile,
  changePassword,
} from "../api/client";
import type { ILoginAuth } from "../schemas/loginSchema";
import type { IProfile } from "../schemas/profileSchema";
import {
  registrationAuthSchema,
  type IRegistrationAuth,
} from "../schemas/registrationSchema";
import type { IUpdateProfile } from "../schemas/updateProfileSchema";
import type { IChangePassword } from "../schemas/changePasswordSchema";

export const useAuthStore = defineStore("auth", () => {
  // In-memory хранение для access token
  const accessToken = ref<string | null>(null);
  const user = ref<IProfile | null>(null);

  // Геттер для проверки авторизации
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  function getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  // Инициализация при запуске
  async function init() {
    const refreshToken = getRefreshToken();
    const storedAccessToken = localStorage.getItem('accessToken');
    
    // Восстанавливаем токен из localStorage если есть
    if (storedAccessToken) {
      accessToken.value = storedAccessToken;
    }
    
    if (!refreshToken) return false;

    try {
      const result = await refreshAuthToken();
      return result;
    } catch (error: unknown) {
      console.error("Ошибка при инициализации токена:", error);
      logout();
      return false;
    }
  }

  // Авторизация
  async function login(data: ILoginAuth) {
    try {
      const response = await loginUser(data);
      accessToken.value = response.accessToken;
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      user.value = response.user;
      return true;
    } catch (error) {
      console.error("Ошибка логина:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Произошла ошибка при авторизации";
      if (errorMessage.includes("Invalid credentials")) {
        throw new Error(
          "Неверные учетные данные. Пожалуйста, проверьте логин и пароль."
        );
      } else if (errorMessage.includes("User not found or inactive")) {
        throw new Error(
          "Пользователь не найден или неактивен. Обратитесь к администратору."
        );
      } else {
        throw new Error(
          "Произошла ошибка при авторизации. Пожалуйста, попробуйте позже."
        );
      }
    }
  }

  // Выход
  async function logout() {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken && accessToken.value) {
        await logoutUser(accessToken.value);
      }
    } finally {
      accessToken.value = null;
      user.value = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  // Обновление токена
  async function refreshAuthToken() {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await refreshTokens({ refreshToken });
      accessToken.value = response.accessToken;
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);

      if (response.user) {
        user.value = response.user;
      }

      return true;
    } catch (error: unknown) {
      console.error("Ошибка обновления токена:", error);
      accessToken.value = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return false;
    }
  }

  // Регистрация нового пользователя
  async function register(data: IRegistrationAuth) {
    try {
      const validatedData = registrationAuthSchema.parse(data);

      await registerUser(validatedData);
    } catch (error) {
      console.error("Ошибка регистрации:", error);
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("User with this login already exists")) {
          throw new Error(
            "Этот логин уже занят. Пожалуйста, выберите другой логин."
          );
        } else {
          throw new Error(
            "Произошла ошибка при регистрации. Пожалуйста, попробуйте позже."
          );
        }
      }
      return false;
    }
    return true;
  }

  // Получаем профиль пользователя
  async function currentProfile() {
    if (!isAuthenticated.value) {
      throw new Error("Пользователь не авторизован");
    }

    try {
      const profile = await getProfile(accessToken.value!);
      user.value = profile;
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("Token is invalid or expired")) {
          throw new Error(
            "Токен недействителен или истек. Пожалуйста, войдите снова."
          );
        } else {
          throw new Error(
            "Произошла ошибка при получении профиля пользователя."
          );
        }
      }
      console.error("Ошибка получения профиля:", error);
      return false;
    }
    return true;
  }

  // Обновляем профиль пользователя
  async function updateCurrentProfile(data: IUpdateProfile) {
    if (!isAuthenticated.value) {
      throw new Error("Пользователь не авторизован");
    }
    try {
      const updatedProfile = await updateProfile(accessToken.value!, data);
      user.value = updatedProfile;
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("Token is invalid or expired")) {
          throw new Error(
            "Токен недействителен или истек. Пожалуйста, войдите снова."
          );
        } else {
          throw new Error(
            "Произошла ошибка при обновлении профиля пользователя."
          );
        }
      }
      console.error("Ошибка обновления профиля:", error);
      return false;
    }
    return true;
  }

  // Изменение пароля
  async function changeCurrentPassword(data: IChangePassword) {
    if (!isAuthenticated.value) {
      throw new Error("Пользователь не авторизован");
    }

    try {
      await changePassword(accessToken.value!, data);
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message;
        if (errorMessage.includes("Token is invalid or expired")) {
          throw new Error(
            "Токен недействителен или истек. Пожалуйста, войдите снова."
          );
        } else if (errorMessage.includes("Invalid current password")) {
          throw new Error(
            "Неверный старый пароль. Пожалуйста, попробуйте еще раз."
          );
        } else {
          throw new Error(
            "Произошла ошибка при изменении пароля. Пожалуйста, попробуйте позже."
          );
        }
      }
      console.error("Ошибка изменения пароля:", error);
      return false;
    }
    return true;
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    login,
    logout,
    init,
    refreshAuthToken,
    register,
    currentProfile,
    updateCurrentProfile,
    changeCurrentPassword,
  };
});
