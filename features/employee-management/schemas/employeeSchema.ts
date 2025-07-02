import { z } from 'zod';

// Enum для типов ставок
export enum EUserTrackerRateType {
  PROJECT = 'project',
  QUEUE = 'queue', 
  GLOBAL = 'global'
}

// Схемы для справочников
export const trackerProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  key: z.string(),
});

export const trackerQueueSchema = z.object({
  id: z.number(),
  name: z.string(),
  key: z.string(),
});

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

// Новая схема для изменения ставки с типами
export const rateChangeSchema = z.object({
  type: z.nativeEnum(EUserTrackerRateType),
  rate: z.number().min(0),
  userId: z.string().uuid(),
  contextValue: z.string().optional(),
  comment: z.string().optional(),
});

// Новая схема для батчевого обновления ставок
export const batchRateUpdateSchema = z.object({
  changes: z.array(rateChangeSchema),
});

// Старые схемы для совместимости (пока оставим)
export const salaryChangeSchema = z.object({
  employeeId: z.string().uuid(),
  newRate: z.number().min(0),
  comment: z.string().optional(),
});

export const batchSalaryUpdateSchema = z.object({
  changes: z.array(salaryChangeSchema),
});

export type IEmployee = z.infer<typeof employeeSchema>;
export type IRateChange = z.infer<typeof rateChangeSchema>;
export type IBatchRateUpdate = z.infer<typeof batchRateUpdateSchema>;

// Типы для справочников
export type ITrackerProject = z.infer<typeof trackerProjectSchema>;
export type ITrackerQueue = z.infer<typeof trackerQueueSchema>;

// Старые типы для совместимости
export type ISalaryChange = z.infer<typeof salaryChangeSchema>;
export type IBatchSalaryUpdate = z.infer<typeof batchSalaryUpdateSchema>;

// Тип для работы с UI (добавляем поля для отслеживания изменений)
export interface IEmployeeWithChanges extends IEmployee {
  newRate?: number;
  hasChanges: boolean;
  isEditing: boolean;
  newSalaryInput?: number; // временное поле для UI (оклад)
  newDirectRate?: number; // временное поле для UI (прямая ставка)
}
