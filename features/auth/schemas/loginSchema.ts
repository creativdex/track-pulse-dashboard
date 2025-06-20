import { z } from 'zod';
import { profileSchema } from './profileSchema';

export const loginAuthSchema = z.object({
  login: z.string().min(3, 'Логин должен содержать не менее 3 символов'),
  password: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
});

export const tokenAuthSchema = z.object({
  accessToken: z.string().min(20, 'Токен авторизации обязателен'),
  refreshToken: z.string().min(20, 'Токен обновления обязателен'),
  user: profileSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20, 'Токен обновления обязателен'),
});

export type ILoginAuth = z.infer<typeof loginAuthSchema>;
export type ITokenAuth = z.infer<typeof tokenAuthSchema>;
export type IRefreshToken = z.infer<typeof refreshTokenSchema>;
