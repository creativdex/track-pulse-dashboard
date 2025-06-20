/**
 * Общие утилиты для работы с API
 */

// Вспомогательная функция для проверки, является ли значение обычным объектом
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Получение базового URL API
 * @returns Базовый URL для API запросов
 */
export function getApiBaseUrl(): string {
  const config = useRuntimeConfig();
  return config.public.apiBaseUrl;
}

/**
 * Получение токена авторизации
 * @returns Токен авторизации или null если не найден
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

/**
 * Создание стандартных заголовков для авторизованных запросов
 * @param additionalHeaders Дополнительные заголовки
 * @returns Объект с заголовками
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Обрабатывает ошибки API и преобразует их в стандартные ошибки JavaScript
 * @param error Объект ошибки
 * @param defaultMessage Сообщение по умолчанию
 * @returns Ошибка в стандартном формате Error
 */
export function handleApiError(error: unknown, defaultMessage = 'Произошла ошибка'): Error {
  console.error(`API Error (${defaultMessage}):`, error);

  // Ошибки API с ответом
  if (isObject(error) && 'response' in error && error.response !== null) {
    const response = error.response;
    
    // Если есть данные в формате стандартного API ответа
    if (isObject(response) && '_data' in response && response._data !== null) {
      const apiError = response._data as { message?: string };
      if (apiError?.message) {
        return new Error(apiError.message);
      }
    }
    
    // Если есть код состояния HTTP
    if (isObject(response) && 'status' in response) {
      const status = Number(response.status);
      
      if (!isNaN(status)) {
        // Стандартные HTTP ошибки
        switch (status) {
          case 401:
            return new Error('Необходима авторизация');
          case 403:
            return new Error('Доступ запрещен');
          case 404:
            return new Error('Ресурс не найден');
          case 400:
            return new Error('Неверные данные запроса');
          case 500:
            return new Error('Внутренняя ошибка сервера');
          default:
            return new Error(`Ошибка HTTP ${status}`);
        }
      }
    }
  }

  // Прямые ошибки с данными
  if (isObject(error) && 'data' in error) {
    const apiError = error.data as { message?: string };
    if (apiError?.message) {
      return new Error(apiError.message);
    }
  }

  // Стандартные JavaScript ошибки
  if (error instanceof Error) {
    return error;
  }

  // Строковые ошибки
  if (typeof error === 'string') {
    return new Error(error);
  }

  // Fallback
  return new Error(defaultMessage);
}

/**
 * Проверяет наличие токена авторизации
 * @throws Error если токен отсутствует
 */
export function requireAuthToken(): string {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Отсутствует токен авторизации');
  }
  return token;
}

/**
 * Выполняет авторизованный GET запрос
 * @param endpoint URL endpoint
 * @param query Параметры запроса
 * @returns Promise с результатом
 */
export async function fetchWithAuth<T>(
  endpoint: string, 
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    query?: Record<string, string | boolean>;
    body?: Record<string, unknown> | null;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  requireAuthToken(); // Проверяем наличие токена

  const { method = 'GET', query, body, headers = {} } = options;

  return await $fetch<T>(`${baseUrl}${endpoint}`, {
    method,
    headers: createAuthHeaders(headers),
    query,
    body,
  });
}
