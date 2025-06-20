import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
  lastName: z.string().min(2, 'Фамилия должна содержать минимум 2 символа').optional(),
});

export type IUpdateProfile = z.infer<typeof UpdateProfileSchema>;
