import { z } from 'zod';

export const registrationAuthSchema = z.object({
  login: z.string().min(3, 'Логин должен содержать не менее 3 символов'),
  password: z.string().min(6, 'Пароль должен содержать не менее 6 символов'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type IRegistrationAuth = z.infer<typeof registrationAuthSchema>;