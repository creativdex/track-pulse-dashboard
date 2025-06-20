import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type IUpdateUser = z.infer<typeof updateUserSchema>;