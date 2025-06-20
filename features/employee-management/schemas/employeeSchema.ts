import { z } from 'zod';

export const employeeSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  display: z.string().min(2).max(100),
  email: z.string().email(),
  login: z.string().min(2).max(100),
  dismissed: z.boolean(),
  rate: z.number().nullable(),
});

export const salaryChangeSchema = z.object({
  employeeId: z.string().uuid(),
  newRate: z.number().min(0),
  comment: z.string().optional(),
});

export const batchSalaryUpdateSchema = z.object({
  changes: z.array(salaryChangeSchema),
});

export type IEmployee = z.infer<typeof employeeSchema>;
export type ISalaryChange = z.infer<typeof salaryChangeSchema>;
export type IBatchSalaryUpdate = z.infer<typeof batchSalaryUpdateSchema>;

// Тип для работы с UI (добавляем поля для отслеживания изменений)
export interface IEmployeeWithChanges extends IEmployee {
  newRate?: number;
  hasChanges: boolean;
  isEditing: boolean;
}
