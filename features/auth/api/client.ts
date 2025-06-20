import {
  loginAuthSchema,
  type ILoginAuth,
  type IRefreshToken,
  type ITokenAuth,
} from "../schemas/loginSchema";
import {
  registrationAuthSchema,
  type IRegistrationAuth,
} from "../schemas/registrationSchema";
import type { IProfile } from "../schemas/profileSchema";
import type { IUpdateProfile } from "../schemas/updateProfileSchema";
import type { IChangePassword } from "../schemas/changePasswordSchema";
import type { IUpdateUser } from "../schemas/updateUserSchema";
import { handleApiError } from "~/shared/api/utils";

// Вспомогательная функция для получения базового URL
function getApiBaseUrl() {
  const config = useRuntimeConfig();
  return config.public.apiBaseUrl;
}

// ===== МЕТОДЫ АВТОРИЗАЦИИ =====

/**
 * Отправляет запрос на авторизацию пользователя
 * @param loginData Данные для авторизации (логин и пароль)
 * @returns Объект с токенами и данными пользователя
 */
export async function loginUser(loginData: ILoginAuth): Promise<ITokenAuth> {
  try {
    loginAuthSchema.parse(loginData);
    const baseUrl = getApiBaseUrl();

    return await $fetch<ITokenAuth>(`${baseUrl}/auth/login`, {
      method: "POST",
      body: loginData,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка авторизации");
  }
}

/**
 * Отправляет запрос на регистрацию нового пользователя
 * @param registrationData Данные для регистрации пользователя
 * @returns Объект c пользователем
 */
export async function registerUser(
  registrationData: IRegistrationAuth
): Promise<IProfile> {
  try {
    registrationAuthSchema.parse(registrationData);
    const baseUrl = getApiBaseUrl();

    return await $fetch<IProfile>(`${baseUrl}/auth/register`, {
      method: "POST",
      body: registrationData,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка регистрации");
  }
}

/**
 * Отправляет запрос на обновление токена
 * @param refreshToken Refresh токен для обновления
 * @returns Новые токены доступа и обновления
 */
export async function refreshTokens(
  refreshData: IRefreshToken
): Promise<ITokenAuth> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<ITokenAuth>(`${baseUrl}/auth/refresh`, {
      method: "POST",
      body: refreshData,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка обновления токенов");
  }
}

/**
 * Отправляет запрос на выход пользователя (инвалидация токена)
 */
export async function logoutUser(accessToken: string): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    await $fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка выхода из системы");
  }
}

// ===== МЕТОДЫ ПРОФИЛЯ =====

/**
 * Получает данные текущего пользователя
 * @param accessToken JWT токен для авторизации
 * @returns Данные текущего пользователя
 */
export async function getProfile(accessToken: string): Promise<IProfile> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<IProfile>(`${baseUrl}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка получения профиля пользователя");
  }
}

/**
 * Получает данные текущего пользователя
 * @param accessToken JWT токен для авторизации
 * @returns Данные текущего пользователя
 */
export async function updateProfile(
  accessToken: string,
  updateData: IUpdateProfile
): Promise<IProfile> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<IProfile>(`${baseUrl}/auth/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: updateData,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка получения профиля пользователя");
  }
}

/**
 * Изменяет пароль текущего пользователя
 * @param accessToken JWT токен для авторизации
 * @param oldPassword Старый пароль
 * @param newPassword Новый пароль
 */
export async function changePassword(
  accessToken: string,
  data: IChangePassword
): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    await $fetch(`${baseUrl}/auth/profile/password`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: data,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка смены пароля");
  }
}

// ===== МЕТОДЫ УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ (АДМИН) =====

/**
 * Получает список всех пользователей (для админа)
 * @param accessToken JWT токен для авторизации
 * @returns Массив всех пользователей
 */
export async function getAllUsers(accessToken: string): Promise<IProfile[]> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<IProfile[]>(`${baseUrl}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка получения списка пользователей");
  }
}

/**
 * Создает нового пользователя (для админа)
 * @param accessToken JWT токен для авторизации
 * @param userData Данные для создания пользователя
 * @returns Созданный пользователь
 */
export async function createUser(
  accessToken: string,
  userData: IRegistrationAuth
): Promise<IProfile> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<IProfile>(`${baseUrl}/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: userData,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка создания пользователя");
  }
}

/**
 * Получает данные пользователя по ID (для админа)
 * @param accessToken JWT токен для авторизации
 * @param userId ID пользователя
 * @returns Данные пользователя
 */
export async function getUserById(
  accessToken: string,
  userId: string
): Promise<IProfile> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<IProfile>(`${baseUrl}/users/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка получения данных пользователя");
  }
}

/**
 * Обновляет данные пользователя по ID (для админа)
 * @param accessToken JWT токен для авторизации
 * @param userId ID пользователя
 * @param updateData Данные для обновления
 * @returns Обновленные данные пользователя
 */
export async function updateUserById(
  accessToken: string,
  userId: string,
  updateData: IUpdateUser
): Promise<IProfile> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<IProfile>(`${baseUrl}/users/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: updateData,
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка обновления данных пользователя");
  }
}

/**
 * Удаляет пользователя по ID (для админа)
 * @param accessToken JWT токен для авторизации
 * @param userId ID пользователя
 */
export async function deleteUser(
  accessToken: string,
  userId: string
): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    await $fetch(`${baseUrl}/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка удаления пользователя");
  }
}

/**
 * Устанавливает новый пароль пользователя (для админа)
 * @param accessToken JWT токен для авторизации
 * @param userId ID пользователя
 * @param newPassword Новый пароль для пользователя
 * @returns Подтверждение установки пароля
 */
export async function setUserPassword(
  accessToken: string,
  userId: string,
  newPassword: string
): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    await $fetch(`${baseUrl}/users/${userId}/password`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: { newPassword },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка установки пароля пользователя");
  }
}

/**
 * Активирует пользователя (для админа)
 * @param accessToken JWT токен для авторизации
 * @param userId ID пользователя
 * @returns void (только статус операции)
 */
export async function activateUser(
  accessToken: string,
  userId: string
): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    await $fetch(`${baseUrl}/users/${userId}/activate`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка активации пользователя");
  }
}

/**
 * Деактивирует пользователя (для админа)
 * @param accessToken JWT токен для авторизации
 * @param userId ID пользователя
 * @returns void (только статус операции)
 */
export async function deactivateUser(
  accessToken: string,
  userId: string
): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    await $fetch(`${baseUrl}/users/${userId}/deactivate`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка деактивации пользователя");
  }
}

/**
 * Универсальный метод для изменения статуса пользователя
 * @param accessToken JWT токен для авторизации
 * @param userId ID пользователя
 * @param isActive Новый статус активности
 * @returns void (только статус операции)
 */
export async function updateUserStatus(
  accessToken: string,
  userId: string,
  isActive: boolean
): Promise<void> {
  if (isActive) {
    await activateUser(accessToken, userId);
  } else {
    await deactivateUser(accessToken, userId);
  }
}

/**
 * Получает список пользователей, ожидающих активации (для админа)
 * @param accessToken JWT токен для авторизации
 * @returns Массив пользователей, ожидающих активации
 */
export async function getPendingUsers(accessToken: string): Promise<IProfile[]> {
  try {
    const baseUrl = getApiBaseUrl();
    return await $fetch<IProfile[]>(`${baseUrl}/users/pending-activation`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: unknown) {
    throw handleApiError(error, "Ошибка получения списка пользователей, ожидающих активации");
  }
}
