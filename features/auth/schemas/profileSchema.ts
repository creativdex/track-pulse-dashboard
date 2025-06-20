import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string().uuid(),
  login: z.string().min(3, 'Login is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});



export type IProfile = z.infer<typeof profileSchema>;

export type IProfileUser = Omit<IProfile, 'id' | 'role' | 'lastLoginAt' | 'createdAt' | 'updatedAt'>;